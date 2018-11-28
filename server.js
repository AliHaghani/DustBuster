const express = require('express');
const app     = express();
const util    = require('./util');

app.get('/bust', async (req, res) => {
  let projectUrl = req.param('url');
  let projectName = projectUrl.substr(projectUrl.lastIndexOf('/') + 1);
  let project = await util.getProject(projectUrl);
  let transformedObj = await util.transformObject(project);
  let resObj = {
    name: projectName,
    children: transformedObj,
  };
  let chart = util.makeD3Tree(resObj);
  res.send(chart);
});

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

app.use('/assets', express.static('assets'));
const PORT = process.env.PORT || 8080;
app.listen(PORT);
console.log(`Server running on port ${PORT}`);
exports = module.exports = app;
