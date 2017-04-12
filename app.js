const express = require('express');
const exphbs  = require('express-handlebars');
const app = express();

const getInlineParams = require('./getInlineParams.js');

app.engine('hbs', exphbs());
app.set('view engine', 'hbs');

app.get('/inline/video/:video_id.js', (req, res) => {
  getInlineParams(req.params).then(params => {
    console.log(params.playerCode.js)
    res.render('inline_embed', params);
  })
});

app.listen(3001, function () {
  console.log('listening on port 3001');
});
