import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "******",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted(member) {
  const result = await db.query(`SELECT country_code FROM visited_countries where user_id = ${member}`);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  console.log(countries);
  return countries;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted(currentUserId);
  const color = await db.query(`select color from users where (id = ${currentUserId})`);
  console.log(countries.length);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: color.rows[0].color,
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code, user_id) VALUES ($1, $2)",
        [countryCode, currentUserId]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});
app.post("/user", async (req, res) => {
  currentUserId = req.body.user;
  if(req.body.add == "new") {
    res.render("new.ejs");
  } else {
    checkVisisted(currentUserId);
    res.redirect("/");
  }
  
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  
  const name = req.body.name;
  const color = req.body.color;
  
  try {
    const result = await db.query(
      "INSERT INTO users (name, color) VALUES ($1, $2) returning id",
      [name, color]
    );
    currentUserId = result.rows[0].id;
    users = (await db.query(`select * from users`)).rows;
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
  

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
