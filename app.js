const express = require('express');
const exphbs  = require('express-handlebars');
const app = express();

const getInlineParams = require('./getInlineParams.js');

const hbs = exphbs.create({
  partialsDir: ['views/partials/']
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

app.get('/inline/video/:video_id.js', (req, res) => {
  getInlineParams(req.params).then(params => {
    hbs.getPartials().then(partials => console.log(partials));
    res.render('inline_embed', params);
  })
});

app.get('/script/video/:video_id.js', (req, res) => {
  console.log(req.params);
  console.log(req.query);
  res.render('script_embed', {
    videoId: req.params.videoId,
    adUnitId: req.query.adUnitId
  })
});

app.listen(3001, function () {
  console.log('listening on port 3001');
});
