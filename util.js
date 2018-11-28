const axios = require('axios');
const atob = require('atob');
const linter = require('./linter');
const GITHUB_API = 'https://api.github.com/repos';
const WARNING = 'warning';
const ERROR = 'error';

const mysecretobjectpleasedontsteal = {
  client_id: '7b75ed090eaf22c7e569',
  client_secret: '5d300934fe6df77cfe1a9768b93f5b80422fe8f1'
};

var maxErrors = 1;
let self = module.exports = {
  getProject: async (projectUrl) => {
    maxErrors = 1;
    let trimmed = self.trimGithubUrl(projectUrl);
    let res = await axios.get(`${GITHUB_API}/${trimmed}/git/trees/master`, {
      params: mysecretobjectpleasedontsteal
    });
    let trees = res.data.tree;
    let traversed = await self.traverseTree(trees);
    let info = await self.addPercentage(traversed);
    traversed.percentage = info.percentage;
    traversed.warning = info.warning;
    traversed.error = info.error;
    return traversed;
  },

  addPercentage: async (tree) => {
    if (typeof tree.warning !== 'undefined') {
        tree.percentage = (tree.warning + tree.error) / maxErrors;
    } else {
      let percentage = 0;
      let warnings = 0;
      let errors = 0;
      for (let child in tree) {
        let info = await self.addPercentage(tree[child]);
        percentage += info.percentage;
        warnings += info.warning;
        errors += info.error;
      }

      let numKeys = Object.keys(tree).length;
      if (numKeys > 0) {
        percentage /= numKeys;
        tree.percentage = percentage;
        tree.error = errors;
        tree.warning = warnings;
      }
    }

    let info = {};
    info.percentage = tree.percentage || 0;
    info.warning = tree.warning || 0;
    info.error = tree.error || 0;
    return info;
  },


  traverseTree: async (trees) => {
    let fileTree = {};
    for (let tree of trees) {
          if (tree.type === 'blob' && tree.path.endsWith('.js')) {
            let res = await axios.get(tree.url , {
              params: mysecretobjectpleasedontsteal
            });
            let contents = atob(res.data.content);
            let lintedContent = linter.lint(contents);
            let numMessages = {};

            numMessages[WARNING] = self.filterMessagesByKey(lintedContent, WARNING);
            numMessages[ERROR] = self.filterMessagesByKey(lintedContent, ERROR);
            maxErrors = Math.max(numMessages[WARNING] + numMessages[ERROR], maxErrors);
            fileTree[tree.path] =  numMessages;
          } else if (tree.type === 'tree') {
            let res = await axios.get(tree.url, {
              params: mysecretobjectpleasedontsteal
            });
            fileTree[tree.path] = await self.traverseTree(res.data.tree);
          }
    }
    return fileTree;
  },

  trimGithubUrl: (projectUrl) => {
    let pre = 'https://github.com/';
    return projectUrl.substr(projectUrl.indexOf(pre) + pre.length);
  },


  filterMessagesByKey: (arr, key) => {
    return arr.filter(x => {
        switch (key) {
          case WARNING:
            return x.severity === 1;
          case ERROR:
            return x.severity === 2;
        }
      }).length;
  },

  transformObject: (obj) => (
    Object
      .keys(obj)
      .filter(filterKey => Object.keys(obj[filterKey]).length > 0)
      .map(key => {
        let fileObj = {
          name: key,
          percentage: obj[key].percentage,
          warning: obj[key][WARNING],
          error: obj[key][ERROR]
        };
        if (Object.keys(obj[key]).length > 0 &&
            !key.endsWith('.js')) {
          fileObj.children = self.transformObject(obj[key]);
        }
        return fileObj;
      })
  )
};
