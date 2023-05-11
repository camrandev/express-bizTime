"use strict";

const request = require("supertest");

const app = require("../app");
const db = require("../db");

let testCompany;

beforeEach(async function () {
  await db.query("DELETE FROM companies");
  let result = await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple Computer', 'A fast computer')
    RETURNING code, name, description`);
  testCompany = result.rows[0];
});

/** GET /companies: returns list of companies like
 * {companies: [{code, name}, ...]} */

describe("GET /companies", function () {
  test("Gets companies", async function () {
    const resp = await request(app).get(`/companies`);
    expect(resp.body).toEqual({
      companies: [{ code: testCompany.code, name: testCompany.name }],
    });
  });
});

//close the db conection after all tests have been run
afterAll(async () => {
  db.end()
});

/** GET /companies/[code]: returns object of company with the associated code
 * in the query string: {company: {code, name, description}}

 * If company isn't found, returns NotFoundError
*/

describe("GET /companies/:code", function () {
  test("Gets single company", async function () {
    const resp = await request(app).get(`/companies/${testCompany.code}`);
    expect(resp.body).toEqual({ company: testCompany });
  });

  test("404 if not found", async function () {
    const resp = await request(app).get(`/companies/-1`);
    expect(resp.statusCode).toEqual(404);
  });
});


/** POST /companies: accepts JSON body, adds company to database, returns
 * added object of added company
 *
 * Takes as input JSON: {code, name, description}
   Returns object of company: {company: {code, name, description}}

   If no input JSON, throws BadRequestError
 */

describe("POST /companies", function () {
  test("Create new company", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send({ code: "ibm", name: "IBM company", description: "Some company" });
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: { code: "ibm", name: "IBM company", description: "Some company" },
    });
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .post(`/companies`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});


/** PUT /companies/[code]: accepts JSON body, edits existing company in database,
 * returns updated company object.
 *
 * Takes as input JSON: {name, description}
   Returns object of company: {company: {code, name, description}}

   If company is not found, throws NotFoundError. If no input JSON is given,
   throws BadRequestError
 */

describe("PUT /companies/:code", function () {
  test("Update single company", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send({ name: "New name", description: "New description" });
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({
      company: { code: testCompany.code, name: "New name", description: "New description" },
    });
  });

  test("404 if not found", async function () {
    const resp = await request(app)
      .put(`/companies/-1`)
      .send({ name: "New name", description: "New description" });
    expect(resp.statusCode).toEqual(404);
  });

  test("400 if empty request body", async function () {
    const resp = await request(app)
      .put(`/companies/${testCompany.code}`)
      .send();
    expect(resp.statusCode).toEqual(400);
  });
});


/** DELETE /companies/[code].
 *
 * Deletes compan with the given code, and returns {status: "deleted"}
 * if successful. If company not found, throws NotFoundError.
 */

describe("DELETE /companies/:code", function () {
  test("Delete single company", async function () {
    const resp = await request(app)
      .delete(`/companies/${testCompany.code}`);
    expect(resp.statusCode).toEqual(200);
    expect(resp.body).toEqual({ status: "deleted" });
  });
});