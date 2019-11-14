const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Users = require("../users/users-model.js");

const { validateUser } = require("../users/users-helpers");
// for endpoints beginning with /api/auth
router.post("/register", (req, res) => {
  let user = req.body;

  const validateResult = validateUser(user);
  if (validateResult.isSuccessful === true) {
    const hash = bcrypt.hashSync(user.password, 10); // 2 ^ n
    user.password = hash;
    // need to validate data before sending to db
    Users.add(user)
      .then(saved => {
        res.status(201).json(saved);
      })
      .catch(error => {
        res.status(500).json(error);
      });
  } else {
    res.status(400).json({
      message: "Invalid User Info",
      errors: validateResult.errors
    });
  }
});

router.post("/login", (req, res) => {
  let { username, password } = req.body;

  Users.findBy({ username })
    .first()
    .then(user => {
      if (user && bcrypt.compareSync(password, user.password)) {
        //produce token and send to client
        const token = getJwtToken(user.username);

        res.status(200).json({
          message: `Welcome ${user.username} have a token!`,
          token
        });
      } else {
        res.status(401).json({ message: "Invalid Credentials" });
      }
    })
    .catch(error => {
      res.status(500).json(error);
    });
});

function getJwtToken(username) {
  const payload = {
    username,
    role: "Student" //this will probaly come from the database
  };
  const secret = process.env.JWT_SECRET || "is it secret";
  const options = {
    expiresIn: "1d"
  };
  return jwt.sign(payload, secret, options);
}
module.exports = router;
