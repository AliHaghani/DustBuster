const express = require('express');
const app     = express();
const util    = require('./util');

app.get('/bust', async (req, res) => {
  let projectUrl = req.param('url');
  let project = util.getProject(projectUrl);
  res.send('Ok sick, got URL.');
});

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

app.use('/assets', express.static('assets'));
const PORT = process.env.PORT || 8080;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);
exports = module.exports = app;
