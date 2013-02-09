var
  https = require("https"),
  util = require("util"),
  fs = require("fs");

var headers = { "Accept": "application/vnd.github.v3.raw+json" };
var pathFmt = "/repos/%s/%s/issues?state=%s&labels=%s";

function escape(urlPart) {
  return encodeURIComponent(urlPart).replace("%20", "+");
}

function fetchIssuesOfType(owner, repo, label, type, cb) {
  var path = util.format(pathFmt, escape(owner), escape(repo), escape(type), escape(label));
  var options = {
    hostname: "api.github.com",
    path: path,
    headers: headers
  };
  https.get(options, function (res) {
    res.setEncoding("utf8");
    var payload = "";
    if (res.statusCode != 200) return cb(res);

    res.on("data", function (chunk) {
      payload += chunk;
    }).on("end", function () {
      cb(null, JSON.parse(payload));
    });
  }).on("error", function (e) {
    cb(e);
  });
}

function fetchIssues(owner, repo, label, cb) {
  var all = [];
  console.info("Fetching open issues...");
  fetchIssuesOfType(owner, repo, label, "open", function (err, issues) {
    if (err) return cb(err);
    all.push.apply(all, issues);
    console.info("Fetching closed issues...");
    fetchIssuesOfType(owner, repo, label, "closed", function (err, issues) {
      if (err) return cb(err);
      all.push.apply(all, issues);
      cb(null, issues);
    });
  });
}

var args = process.argv.slice(2);
if (args.length != 3) {
  console.error("Usage: %s <owner> <repo> <filter label>", process.argv[1]);
  console.error("Don't pass bad arguments, things will break!");
  process.exit(1);
}
var
  owner = args[0],
  repo = args[1],
  filter = args[2];
  
fetchIssues(owner, repo, filter, function (err, issues) {
  if (err) throw err;

  console.info("Got %d issues.", issues.length);
  var issueObj = {
    repo: {
      owner: owner,
      name: repo
    },
    filter: filter,
    updated: new Date(),
    issues: issues
  };
  fs.writeFile("issues.js", JSON.stringify(issueObj), function (err) {
    if (err) throw err;
    console.info("Wrote issues.js!");
  });
});
