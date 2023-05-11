"use strict";

const express = require("express");

const db = require("../db");
const { ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError, } = require("../expressError");

const router = new express.Router();

/** GET /companies: returns list of companies like
 * {companies: [{code, name}, ...]}
*/
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT code, name
         FROM companies`);
  const companies = results.rows;
  return res.json({ companies: companies });
});


/** GET /companies/[code]: returns object of company with the associated code
 * in the query string: {company: {code, name, description}}

 * If company isn't found, returns NotFoundError
*/

router.get("/:code",
  async function (req, res, next) {
    const code = req.params.code;

    const results = await db.query(
      `SELECT code, name, description
        FROM companies
        WHERE code = $1`, [code]);

    if (results.rows.length === 0) {
      throw new NotFoundError();
    }

    const company = results.rows[0];

    return res.json({ company: company });
  });



/** POST /companies: accepts JSON body, adds company to database, returns
 * added object of added company
 *
 * Takes as input JSON: {code, name, description}
   Returns object of company: {company: {code, name, description}}

   If no input JSON, throws BadRequestError
*/
router.post("/", async function (req, res, next) {
  if (!req.body) throw new BadRequestError();

  const { code, name, description } = req.body;
  const result = await db.query(
    `INSERT INTO companies (code, name, description)
           VALUES ($1, $2, $3)
           RETURNING code, name, description`,
    [code, name, description],
  );

  const company = result.rows[0];
  return res.status(201).json({ company: company });
});


/** PUT /companies/[code]: accepts JSON body, edits existing company in database,
 * returns updated company object.
 *
 * Takes as input JSON: {name, description}
   Returns object of company: {company: {code, name, description}}

   If company is not found, throws NotFoundError. If no input JSON is given,
   throws BadRequestError
*/

router.put("/:code", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const { name, description } = req.body;
  const code = req.params.code;

  const result = await db.query(
    `UPDATE companies
           SET name=$1,
              description=$2
           WHERE code = $3
           RETURNING code, name, description`,
    [name, description, code],
  );

  if (!result.rows[0]) {
    throw new NotFoundError();
  }

  const company = result.rows[0];
  return res.json({ company: company });
});


/** DELETE /companies/[code].
 *
 * Deletes compan with the given code, and returns {status: "deleted"}
 * if successful. If company not found, throws NotFoundError.
*/
router.delete("/:code", async function (req, res, next) {
  const code = req.params.code;

  const result = await db.query(
    `DELETE FROM companies WHERE code = $1
      RETURNING code`,
    [code],
  );

  if (!result.rows[0]) {
    throw new NotFoundError();
  }

  return res.json({ status: "deleted" });
});

module.exports = router;