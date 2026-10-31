const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({message: "Unable to register user: username and password are required"});
  }
  if (!isValid(username)) {
    return res.status(404).json({message: "User already exists!"});
  }
  users.push({username: username, password: password});
  return res.status(200).json({message: "User successfully registered. Now you can login"});
});

// Get the book list available in the shop
public_users.get('/',function (req, res) {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn], null, 4));
  }
  return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
 });

// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  const author = req.params.author.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .map((isbn) => ({isbn, ...books[isbn]}));
  if (result.length > 0) {
    return res.status(200).send(JSON.stringify({booksbyauthor: result}, null, 4));
  }
  return res.status(404).json({message: "No books found for this author"});
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  const title = req.params.title.toLowerCase();
  const result = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .map((isbn) => ({isbn, ...books[isbn]}));
  if (result.length > 0) {
    return res.status(200).send(JSON.stringify({booksbytitle: result}, null, 4));
  }
  return res.status(404).json({message: "No books found with this title"});
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
  }
  if (Object.keys(books[isbn].reviews).length === 0) {
    return res.status(200).json({message: "No reviews found for this book."});
  }
  return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
});

// ---------------------------------------------------------------------
// Axios clients (Node.js program with 4 methods, run with: node router/general.js)
// ---------------------------------------------------------------------

// Task 10: get all books - async/await with Axios
const getAllBooks = async () => {
  const response = await axios.get(`${BASE_URL}/`);
  return response.data;
};

// Task 11: get book details by ISBN - Promise callbacks with Axios
const getBookByISBN = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`)
    .then((response) => response.data);
};

// Task 12: get book details by author - async/await with Axios
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// Task 13: get book details by title - Promise callbacks with Axios
const getBooksByTitle = (title) => {
  return axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => response.data);
};

// Run the four Axios methods against the running server when this file is executed directly
if (require.main === module) {
  (async () => {
    try {
      console.log("--- All books (async/await) ---");
      console.log(JSON.stringify(await getAllBooks(), null, 2));
      console.log("--- Book by ISBN 1 (promise) ---");
      console.log(JSON.stringify(await getBookByISBN(1), null, 2));
      console.log("--- Books by author Jane Austen (async/await) ---");
      console.log(JSON.stringify(await getBooksByAuthor("Jane Austen"), null, 2));
      console.log("--- Books by title Pride and Prejudice (promise) ---");
      console.log(JSON.stringify(await getBooksByTitle("Pride and Prejudice"), null, 2));
    } catch (error) {
      console.error("Request failed:", error.message);
    }
  })();
}

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
