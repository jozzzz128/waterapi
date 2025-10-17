//Server
const express = require('express');
const app = express();
const port = 3000;
//Data
const data = {
    waterLevel: 5,
    distance: 10,
};
const error = {
    code: 500,
    message: 'Internal Server Error',
};

//Home
app.get('/', (req, res) => {
  res.send('Welcome to the Water API');
});

//Data - update
app.get('/update/:level/:distance', (req, res) => {
  const { level, distance } = req.params;
  // Update data
  data.waterLevel = level;
  data.distance = distance;
  // Handle GET request
  const answer = {
    code: 200,
    message: 'Data updated successfully',
    body: data,
  };
  console.log("update: ", answer);
  // Handle GET request
  if(res) return res.status(200).json(answer);
  return error;
});

//Data - get
app.get('/data', (req, res) => {
  // Handle POST request
  const answer = {
    code: 200,
    message: 'Data received successfully',
    body: data,
  };
  if(res) return res.status(200).json(answer);
  return error;
});

//Raise server
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
