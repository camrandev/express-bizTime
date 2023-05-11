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
  let result = await db.query(`
    INSERT INTO invoices (comp_code, amt)
    VALUES ('apple', '350')
    RETURNING id, comp_code, amt, paid, add_date, paid_date`);
  testInvoice = result.rows[0];
});


//close the db conection after all tests have been run
afterAll(async () => {
  db.end()
});


/** GET /invoices: returns list of invoices like
 * {invoices: [{id, comp_code}, ...]}
*/

describe("GET /invoices", function () {
  test("Gets companies", async function () {
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
      invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }],
    });
  });
});

