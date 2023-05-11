"use strict";

const express = require("express");

const db = require("../db");
const {
  ExpressError,
  NotFoundError,
  UnauthorizedError,
  BadRequestError,
  ForbiddenError,
} = require("../expressError");

const router = new express.Router();

/** GET /invoices: returns list of invoices like
 * {invoices: [{id, comp_code}, ...]}
 */
router.get("/", async function (req, res, next) {
  const results = await db.query(
    `SELECT id, comp_code
         FROM invoices`
  );
  const invoices = results.rows;
  return res.json({ invoices: invoices });
});


/** GET /invoices/[id]: returns obj on given invoice with associated company info
 * in the query string: {invoice: {id, amt, paid, add_date, paid_date, company:
 * {code, name, description}}

 * If invoice isn't found, returns NotFoundError
*/

router.get("/:id", async function (req, res, next) {
  console.log("req.params from invoices id", req.params);
  const id = req.params.id;

  const iResult = await db.query(
    `
    SELECT id, amt, paid, add_date, paid_date, comp_code
    FROM invoices
    WHERE id = $1`,
    [id]
  );
  const invoice = iResult.rows[0];

  if (!invoice) {
    throw new NotFoundError("");
  }

  const cResult = await db.query(
    `
    SELECT code, name, description
    FROM companies
    WHERE code=$1`,
    [invoice.comp_code]
  );

  const company = cResult.rows[0];

  invoice.company = company;

  return res.json({ invoice: invoice });
});

/** POST /invoices: accepts JSON body, adds an invoice, returns
 * object of added invoice
 *
 * Takes as input JSON: {comp_code, amt}
   Returns invoice object {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

   If no input JSON, throws BadRequestError
*/
router.post("/", async function (req, res, next) {
  if (!req.body) throw new BadRequestError();

  const { comp_code, amt } = req.body;

  const result = await db.query(
    `INSERT INTO invoices (comp_code, amt)
           VALUES ($1, $2)
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [comp_code, amt]
  );
  const invoice = result.rows[0];

  return res.status(201).json({ invoice: invoice });
});


/** PUT /invoices/[id]: accepts JSON body, updates an invoice, returns
 * object of added invoice
 *
 * Takes as input JSON: {amt}
   Returns invoice object {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

   If no input JSON, throws BadRequestError. If invoice can't be found, throws
   NotFoundError.
*/
router.put("/:id", async function (req, res, next) {
  if (!req.body) throw new BadRequestError();

  const { amt } = req.body;
  const id = req.params.id;

  const result = await db.query(
    `UPDATE invoices
           SET amt=$1
           WHERE id = $2
           RETURNING id, comp_code, amt, paid, add_date, paid_date`,
    [amt, id],
  );

  if (!result.rows[0]) {
    throw new NotFoundError();
  }

  const invoice = result.rows[0];

  return res.json({ invoice: invoice });
});


/** DELETE /invoices/[id].
 *
 * Deletes invoice with the given id, and returns {status: "deleted"}
 * if successful. If invoice not found, throws NotFoundError.
*/
router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;

  const result = await db.query(
    `DELETE FROM invoices WHERE id = $1
      RETURNING id`,
    [id],
  );

  if (!result.rows[0]) {
    throw new NotFoundError();
  }

  return res.json({ status: "deleted" });
});



module.exports = router;