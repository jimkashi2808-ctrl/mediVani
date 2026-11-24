"use strict";

function notFound(req, res) {
  res.status(404).json({ error: "That API address does not exist." });
}

// Any error passed with next(err) ends up here and is sent back as plain JSON.
function errorHandler(err, req, res, next) {
  console.error(err.message);
  res.status(err.status || 500).json({
    error: err.status ? err.message : "Something went wrong on the server.",
  });
}

module.exports = { notFound, errorHandler };
