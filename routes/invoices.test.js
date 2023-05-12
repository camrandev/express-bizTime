"use strict";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;
let testInvoice;

//create test invoice to use
beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computer', 'A fast computer')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});

//create test invoice to use
beforeEach(async function () {
  await db.query("DELETE FROM invoices");
  //TODO: use below code to control the primary key values when writing tests
  //TODO: remember to use single quotes with this
  await db.query("SELECT setval('invoices_id_seq', 1, false)");

  let result = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ('apple', '350')
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = result.rows[0];
});

//close the db conection after all tests have been run
afterAll(async () => {
  db.end();
});

/** GET /invoices: returns list of invoices like
 * {invoices: [{id, comp_code}, ...]}
 */

describe("GET /invoices", function () {
  test("Gets invoices", async function () {
    const resp = await request(app).get(`/invoices`);
    expect(resp.body).toEqual({
      invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }],
    });
  });
});

/** GET /invoices/[id]: returns obj on given invoice with associated company info
 * in the query string: {invoice: {id, amt, paid, add_date, paid_date, company:
 * {code, name, description}}

 * If invoice isn't found, returns NotFoundError
*/
describe("GET /invoices/:id", function () {
  test("Gets companies", async function () {
    const resp = await request(app).get(`/invoices/${testInvoice.id}`);
    expect(resp.body).toEqual({
      //TODO: want to hardcode the values here, type check values that you dont know
      //TODO: important to test entire shape of the data when building apis
      invoice: {
        id: testInvoice.id,
        comp_code: testInvoice.comp_code,
        amt: testInvoice.amt,
        paid: testInvoice.paid,
        //TODO: if type does not come back correctly, that is also a failed test
        add_date: new Date(testInvoice.add_date).toISOString(),
        paid_date: testInvoice.paid_date,
        company: testCompany,
      },
    });
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/invoices/-1`);
    expect(resp.statusCode).toEqual(404);
  });
});

/** POST /invoices: accepts JSON body, adds an invoice, returns
 * object of added invoice
 *
 * Takes as input JSON: {comp_code, amt}
   Returns invoice object {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

   If no input JSON, throws BadRequestError
*/
describe("POST /invoices", function () {
  test("Create new invoice", async function () {
    const resp = await request(app)
      .post(`/invoices`)
      .send({ comp_code: testCompany.code, amt: 350 });
    //TODO: hard code values for testing, always test the complete shape for APIs
    //TODO: shape matters for apis, for unknown values test datatype
    expect(resp.statusCode).toEqual(201);
    expect(resp.body.comp_code).toEqual(testCompany.comp_code);
    expect(Number(resp.body.invoice.amt)).toEqual(350);
  });

  test("400 if empty request body", async function () {
    const resp = await request(app).post(`/companies`).send();
    expect(resp.statusCode).toEqual(400);
  });
});

/** PUT /invoices/[id]: accepts JSON body, updates an invoice, returns
 * object of added invoice
 *
 * Takes as input JSON: {amt}
   Returns invoice object {invoice: {id, comp_code, amt, paid, add_date, paid_date}}

   If no input JSON, throws BadRequestError. If invoice can't be found, throws
   NotFoundError.
*/

describe("PUT /invoices/:id", function () {
  test("Update single invoice", async function () {
    const resp = await request(app)
      .put(`/invoices/${testInvoice.id}`)
      .send({ amt: 450 });

    //TODO: test the entire shape, ALSO test the amount, test types if values unknown
    //TODO: for testing with primary keys, you can prevent
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      invoice: {
        id: 1,
        comp_code: "apple",
        amt: "450.00",
        paid: false,
        add_date: expect.any(String),
        paid_date: null,
      },
    });
  });

  test("404 if not found", async function () {
    const resp = await request(app).put(`/invoice/-1`).send({ amt: 450 });
    expect(resp.statusCode).toEqual(404);
  });

  test("400 if empty request body", async function () {
    const resp = await request(app).put(`/invoices/${testInvoice.id}`).send();
    expect(resp.statusCode).toEqual(400);
  });
});

/** DELETE /invoices/[id].
 *
 * Deletes invoice with the given id, and returns {status: "deleted"}
 * if successful. If invoice not found, throws NotFoundError.
 */
describe("DELETE /invoices/:id", function () {
  test("Delete single invoice", async function () {
    const resp = await request(app).delete(`/invoices/${testInvoice.id}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });
  });
});
