const Response = require('../utils/ResponseTemplate');
const Books = require('../models').books;
const Contributors = require('../models').contributors;
const { Op } = require('sequelize')
module.exports = {
    getAllBooks: async (req, response) => {

        console.log("WENT HERE GET ALL BOOK");

        console.log(req.query);

        const categories = (req.query.categoryID !== undefined ? req.query.categoryID.split('_') : null);
        const contributorID = (req.query.contributorID !== undefined ? parseInt(req.query.contributorID) : null);
        const searchVal = (req.query.search !== undefined ? req.query.search : null);

        let whereClause = {
            categoryID:
                (categories !== null) ?
                    { [Op.in]: categories } :
                    { [Op.not]: null },
            contributorID:
                (contributorID !== null) ?
                    contributorID :
                    { [Op.not]: null },
            title:
                (searchVal !== null) ?
                    { [Op.like]: "%" + searchVal + "%" } :
                    { [Op.not]: null },
        };

        await Books.findAndCountAll({
            attributes: ['bookID', 'contributorID', 'title', 'author', 'publisher', 'categoryID'],
            where: whereClause,
            include: [
                {
                    model: Contributors,
                    attributes: [['name', 'contributorName']],
                    as: 'contributors',
                },
            ]
        }).then(data => {
            Response.success(
                response,
                data
            )
        })
    },
    createBook: async (req, response) => {

        console.log("WENT HERE CREATE BOOK");

        const authToken = req.headers.authorization;

        console.log(authToken);

        const today = new Date();
        let todayGMT7 = new Date(today.setHours(today.getHours() + 7));
        const newBookData = req.body;

        if (authToken !== undefined) {

            await Contributors.findOne(
                {
                    attributes: ['contributorID'],
                    where: {
                        authToken: authToken
                    }
                }
            )
                .then(contributor => {

                    const contributorID = contributor.dataValues.contributorID;

                    Books.create(
                        {
                            ...newBookData,
                            contributorID: contributorID,
                            createdAt: todayGMT7,
                            updatedAt: todayGMT7
                        }
                    )
                        .then(book => {
                            Response.success(
                                response,
                                book,
                            )
                        })
                        .catch(err => {
                            Response.error(
                                response,
                                err
                            )
                        });

                })
                .catch(err => {
                    Response.error(
                        response,
                        err
                    )
                })

        }
        else {
            Response.failWithData(
                response,
                {
                    code: 403,
                    message: 'Operation Forbidden',
                });
        }


    },
    getBookDetails: async (req, response) => {

        console.log("WENT HERE GET BOOK DETAILS");

        const bookID = req.params.id;

        await Books.findOne({
            where: {
                bookID: bookID
            },
        }).then(book => {
            const contributorID = book.dataValues.contributorID
            Contributors.findOne(
                {
                    attributes: ['name'],
                    where: {
                        contributorID: contributorID
                    }
                }
            ).then(contributor => {
                Response.success(
                    response,
                    {
                        ...book.dataValues,
                        contributorName: contributor.dataValues.name
                    }
                )
            }).catch(err => {
                Response.error(
                    response,
                    err
                )
            })
        }).catch(err => {
            Response.error(
                response,
                err
            )
        })

    },
    editBook: async (req, response) => {

        console.log("WENT HERE EDIT BOOK");

        const authToken = req.headers.authorization;
        const bookID = req.params.id;

        const today = new Date();
        let todayGMT7 = new Date(today.setHours(today.getHours() + 7));

        const updatedBookData = req.body;

        if (authToken !== undefined) {

            await Contributors.findOne(
                {
                    attributes: ['contributorID'],
                    where: {
                        authToken: authToken
                    }
                }
            )
                .then(contributor => {

                    Books.update({
                        ...updatedBookData,
                        updatedAt: todayGMT7
                    }, {
                        where: { bookID: bookID }
                    }).then(result => {
                        console.log("result => ", bookID);
                        if (result == 1) {
                            Response.success(
                                response,
                                {
                                    message: "Book with book ID " + bookID + " successfully editted"
                                }
                            );
                        }

                        else {
                            Response.fail(
                                response,
                                {
                                    message: "Book with book ID " + bookID + " not found, edit failed!"
                                }
                            )
                        }

                    }).catch(function (err) {
                        Response.fail(response, err)
                    })

                })
                .catch(err => {
                    Response.error(
                        response,
                        err
                    )
                })

        }
        else {
            Response.failWithData(
                response,
                {
                    code: 403,
                    message: 'Operation Forbidden',
                });
        }

    },
    deleteBook: async (req, response) => {

        console.log("WENT HERE DELETE BOOK");

        const authToken = req.headers.authorization;
        const bookID = req.params.id;

        if (authToken !== undefined) {

            await Contributors.findOne(
                {
                    attributes: ['contributorID'],
                    where: {
                        authToken: authToken
                    }
                }
            )
                .then(contributor => {

                    Books.destroy({
                        where: {
                            bookID: bookID
                        }
                    })
                        .then(result => {
                            if (result == 1)
                                Response.success(
                                    response,
                                    {
                                        message: "Book with book ID " + bookID + " successfully deleted",
                                    }
                                )
                            else
                                Response.fail(
                                    response,
                                    {
                                        message: "Book with book ID " + bookID + " not found, delete failed!",
                                    }
                                )
                        })
                        .catch(err => {
                            Response.error(
                                response,
                                err
                            )
                        });

                })
                .catch(err => {
                    Response.error(
                        response,
                        err
                    )
                })

        }
        else {
            Response.failWithData(
                response,
                {
                    code: 403,
                    message: 'Operation Forbidden',
                });
        }

    },
};
