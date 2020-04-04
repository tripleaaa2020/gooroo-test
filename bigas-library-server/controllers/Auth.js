const Response = require('../utils/ResponseTemplate');
const Contributors = require('../models').contributors;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
process.env.SECRET_KEY = 'secret';
// const { Op } = require('sequelize')

module.exports = {

    loginContributor(req, response) {

        console.log("WENT HERE LOGIN");

        const today = new Date();
        let todayGMT7 = new Date(today.setHours(today.getHours() + 7));

        const { email, password } = req.body;

        Contributors.findOne({
            where: {
                email: email
            }
        })
            .then(contributor => {
                if (contributor) {
                    console.log("Contributor datavalues=> ", contributor.dataValues);
                    if (bcrypt.compareSync(password, contributor.password)) {
                        let token = jwt.sign(contributor.dataValues, process.env.SECRET_KEY, {
                            expiresIn: 1440
                        })
                        Contributors.update({
                            authToken: token,
                            updatedAt: todayGMT7
                        }, {
                            where: {
                                contributorID: contributor.dataValues.contributorID
                            }
                        }).then(result => {
                            console.log("Contributor result => ", result);
                            Response.success(
                                response,
                                {
                                    userData: {
                                        contributorID: contributor.dataValues.contributorID,
                                        name: contributor.dataValues.name,
                                        email: contributor.dataValues.email,
                                    },
                                    authToken: token
                                },
                            );
                        }).catch(function (err) {
                            Response.fail(response, err)
                        })
                    }
                    else {
                        const err = "Wrong password"
                        Response.error(
                            response,
                            err
                        );
                    }
                }
                else {
                    const err = "Email does not exist";
                    Response.error(
                        response,
                        err
                    );
                }
            })
            .catch(function (err) {
                Response.error(response, err)
            })

    },

    logoutContributor(req, response) {

        console.log("WENT HERE LOGOUT");

        const today = new Date();
        let todayGMT7 = new Date(today.setHours(today.getHours() + 7));

        Contributors.findOne(
            {
                where: {
                    authToken: req.body.headers.Authorization
                }
            }
        ).then(data => {
            if (data !== null) {
                data.update({
                    authToken: null,
                    updatedAt: todayGMT7
                })
                    .then(res => {
                        Response.success(
                            response,
                            { msg: 'Logout Success!!' },
                        )
                    })
            } else {
                Response.fail(
                    response,
                    { message: 'Contributor not found' }
                );
            }
        })
            .catch(function (err) {
                console.log(err);
                Response.error(response, err)
            })

    },

    registerContributor(req, response) {

        console.log("WENT HERE REGISTER");

        const today = new Date();
        let todayGMT7 = new Date(today.setHours(today.getHours() + 7));
        const { name, email, password } = req.body;

        const contributorData = {
            name: name,
            email: email,
            password: password,
            createdAt: todayGMT7,
            updatedAt: todayGMT7,
        }

        Contributors.findOne({
            where: {
                email: email
            }
        })
            .then(contributor => {
                if (!contributor) {
                    bcrypt.hash(password, 10, (err, hash) => {

                        contributorData.password = hash;

                        Contributors.create(contributorData)
                            .then(contributor => {
                                Response.success(
                                    response,
                                    contributor
                                )
                            })
                            .catch(err => {
                                Response.error(
                                    response,
                                    err
                                )
                            });

                    });
                }
                else {
                    const err = "This email is already in use by another contributor!";
                    Response.error(
                        response,
                        err
                    )
                }
            })
            .catch(err => {
                Response.error(
                    response,
                    err
                )
            })
    }
};
