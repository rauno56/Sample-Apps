var express = require('express');
var router = express.Router();
var logger = require('winston');
var async = require('async');
var queries = require('../db/queries');
/*
 * GET Top Active Users
 */
router.get('/topActiveUsers', function(req, res, next) {
    logger.log('info', 'Request for top active users.');
    var pageLimit = 5;
    var returnObject = {
        "error": 0,
        "message": "User Details Query Successfull!",
        "body": {}
    }
    var pageNumber = req.query.pageNumber;
    if (pageNumber === undefined) {
        returnObject.error = "1";
        returnObject.message = "Page Number field missing.";
        res.status(401).send(returnObject);
        logger.log('error', 'Page Number field missing.');
    } else if (pageNumber > 0) {
        var offset = (pageLimit * (pageNumber - 1));
        var topActiveUsers = null;
        queries.getTopActiveUsers(pageLimit, offset).then(function(response) {
            topActiveUsers = response.rows;
            returnObject.body = topActiveUsers;
            res.status(200).json(returnObject);
            logger.log('info', 'fetch topActiveUsers successful with ', {
                'topActiveUsers': topActiveUsers
            });
        }).catch(function(error) {
            next(error);
        });
    } else {
        returnObject.error = "1";
        returnObject.message = "Page Number Invalid!";
        logger.log('error', 'Page Number Invalid');
        res.status(401).send(returnObject);
    }
});
/*
 * GET Details for a User
 */
router.get('/users', function(req, res, next) {
    var USER_ID = parseInt(req.query.id);
    logger.log('info', 'Request for user details for', {
        'user_id': USER_ID
    });
    var returnObject = {
        "error": 0,
        "message": "User Details Query Successfull!",
        "body": {}
    };
    if (USER_ID) {
        async.waterfall([
            function(callback) {
                var userData = null;
                queries.getUserData(USER_ID).then(function(response) {
                    userData = response.rows[0];
                    if (userData) {
                        callback(null, userData);
                        logger.log('info', 'userData for', {
                            'user_id': USER_ID,
                            'userData': userData
                        });
                    } else {
                        returnObject.error = "1";
                        returnObject.message = "User Not Found!";
                        res.status(200).json(returnObject);
                        logger.log('error', 'user not found.', {
                            'user_id': USER_ID,
                            'userData': userData
                        });
                    }
                }).catch(function(error) {
                    next(error);
                });
            },
            function(userData, callback) {
                var applicationData = null;
                queries.getUserApplications(USER_ID).then(function(response) {
                    applicationData = response.rows;
                    callback(null, userData, applicationData);
                    logger.log('info', 'applicationData for', {
                        'user_id': USER_ID,
                        'applicationData': applicationData
                    });
                }).catch(function(error) {
                    next(error);
                });
            },
            function(userData, applicationData, callback) {
                var listingsData = null;
                queries.getUserListings(USER_ID).then(function(response) {
                    listingsData = response.rows;
                    callback(null, userData, applicationData, listingsData);
                    logger.log('info', 'listingsData for', {
                        'user_id': USER_ID,
                        'listingsData': listingsData
                    });
                }).catch(function(error) {
                    next(error);
                });
            },
            function(userData, applicationData, listingsData, callback) {
                var companyData = null;
                queries.getUserCompanies(USER_ID).then(function(response) {
                    companyData = response.rows;
                    callback(null, userData, applicationData, listingsData, companyData);
                    logger.log('info', 'companyData for', {
                        'user_id': USER_ID,
                        'companyData': companyData
                    });
                }).catch(function(error) {
                    next(error);
                });
            }
        ], function(err, userData, applicationData, listingsData, companyData) {
            if (!err) {
                returnObject.body = {
                    id: userData.id,
                    name: userData.name,
                    created_at: userData.created_at,
                    companies: companyData,
                    createdListings: listingsData,
                    applications: applicationData
                }
                res.status(200).json(returnObject);
            }
        });
    } else {
        returnObject.error = "1";
        returnObject.message = "USER_ID not defined!";
        logger.log('error', 'USER_ID not defined');
        res.status(401).json(returnObject);
    }
});
module.exports = router;