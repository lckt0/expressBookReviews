const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// returns true when the username is well formed and not taken yet
const isValid = (username)=>{
  if (!username || typeof username !== 'string') return false;
  return !users.some((user) => user.username === username);
}

// returns true when username and password match a registered user
const authenticatedUser = (username,password)=>{
  return users.some((user) => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({message: "Error logging in: username and password are required"});
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });
    req.session.authorization = { accessToken, username };
    return res.status(200).json({message: "User successfully logged in"});
  }
  return res.status(208).json({message: "Invalid Login. Check username and password"});
});

// Add a book review (or modify the review of the logged in user)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
  }
  if (!review) {
    return res.status(400).json({message: "Review text is required as the 'review' query parameter"});
  }

  const existed = books[isbn].reviews[username] !== undefined;
  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `Review for the book with ISBN ${isbn} ${existed ? "modified" : "added"} successfully`,
    reviews: books[isbn].reviews
  });
});

// Delete the review of the logged in user
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization.username;

  if (!books[isbn]) {
    return res.status(404).json({message: `Book with ISBN ${isbn} not found`});
  }
  if (books[isbn].reviews[username] === undefined) {
    return res.status(404).json({message: `No review by ${username} found for the book with ISBN ${isbn}`});
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Review for the book with ISBN ${isbn} posted by ${username} deleted`,
    reviews: books[isbn].reviews
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
