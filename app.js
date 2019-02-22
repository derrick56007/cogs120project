/**
 * Module dependencies.
 */
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require("fs");
const handlebars = require('express3-handlebars');
const index = require('./routes/index');
const login = require('./routes/login');
const dance = require('./routes/dance');
const create = require('./routes/create');
const create_new = require('./routes/create_new');
// Example route
// var user = require('./routes/user');

const app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('IxD secret key'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

// Example route
app.get('/', login.view);
app.get('/index', index.view);
app.get('/dance/:author/:name', dance.view);
app.get('/create/:author/:name', create.view);
app.get('/create_new/:author', create_new.view);

const multer = require("multer");

const handleError = (err, res) => {
    res
        .status(500)
        .contentType("text/plain")
        .end("Oops! Something went wrong!");
};

const upload = multer({
    dest: "./uploads/"
    // you might also want to set some limits: https://github.com/expressjs/multer#limits
});

const bodyParser = require("body-parser");

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
app.use(bodyParser.urlencoded({
    extended: true
}));

/**bodyParser.json(options)
 * Parses the text as JSON and exposes the resulting object on req.body.
 */
app.use(bodyParser.json());

app.get(
    "/database/:author/:ftype/:fl",
    (req, res) => {
        const author = req.params.author;
        const ftype = req.params.ftype;
        const fl = req.params.fl;

        var filePath = "./database/" + author + "/" + ftype + "/" + fl;

        console.log('downloading ' + filePath);

        const ext = path.extname(fl);


        console.log('downloading ' + ftype + "/" + ext.substring(1));

        var file = fs.readFileSync(filePath);
        res.writeHead(200, {'Content-Type': ftype + "/" + ext.substring(1)})
        res.end(file, 'binary');
    }
);

function saveCue(author, name, cue_name, file_name, fromT, toT) {
    var data = require('./data.json');

    var cue = {
        "name": cue_name,
        "start": fromT,
        "end": toT,
        "file": file_name.substring(1)
    };

    data['users'][author]['dances'][name]['cues'].push(cue);

    var content = JSON.stringify(data);

    fs.writeFile('data.json', content, 'utf8', function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("New cue saved");
    });
}

var mkdirp = require('mkdirp');

app.post(
    "/upload_text/:author/:name/:fromT/:toT",
    (req, res) => {
        const author = req.params.author;
        const name = req.params.name;
        const cue_name = req.body.cue_name;
        const text_area = req.body.text_area;
        const fromT = req.params.fromT;
        const toT = req.params.toT;

        const parent_dir = './database/' + author + '/text/';

        mkdirp(parent_dir, function (err) {
            if (err) return console.error(err);
            else console.log('Done!');

            const file = parent_dir + cue_name + '.txt';

            fs.writeFile(file, text_area, function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The file was saved!");

                saveCue(author, name, file, text_area, fromT, toT);

                res
                    .status(200)
                    .contentType("text/plain")
                    .redirect('back');
            });
        });
    }
);

app.post(
    "/upload_picture/:author/:name/:fromT/:toT",
    upload.single("file" /* name attribute of <file> element in your form */),
    (req, res) => {
        const author = req.params.author;

        const parent_dir = './database/' + author + '/image/';
        const ext = path.extname(req.file.originalname);

        if (!(ext === '.jpg' || ext === '.png' || ext === '.jpeg')) {
            return res
                .status(500)
                .contentType("text/plain")
                .end("Wrong file type! (use png and jpg)");
        }

        mkdirp(parent_dir, function (err) {
            if (err) return console.error(err);
            else console.log('Done!');

            const file = parent_dir + req.file.originalname;

            const name = req.params.name;
            const cue_name = req.body.cue_name;


            fs.rename(req.file.path, file, err => {
                if (err) return handleError(err, res);
                const fromT = req.params.fromT;
                const toT = req.params.toT;
                saveCue(author, name, cue_name, file, fromT, toT);

                res
                    .status(200)
                    .contentType("text/plain")
                    .redirect('back');
            });
        });

    }
);

app.post(
    "/upload_audio/:author/:name/:cue_name/:fromT/:toT",
    upload.single("file" /* name attribute of <file> element in your form */),
    (req, res) => {
        const author = req.params.author;

        const parent_dir = './database/' + author + '/audio/';

        const ext = path.extname(req.file.originalname);

        if (!(ext === '.mp3')) {
            return res
                .status(500)
                .contentType("text/plain")
                .end("Wrong file type! (use mp3)");
        }

        mkdirp(parent_dir, function (err) {
            if (err) return console.error(err);
            else console.log('Done!');

            const file = parent_dir + req.file.originalname;

            const name = req.params.name;
            const cue_name = req.body.cue_name;


            fs.rename(req.file.path, file, err => {
                if (err) return handleError(err, res);
                const fromT = req.params.fromT;
                const toT = req.params.toT;
                saveCue(author, name, cue_name, file, fromT, toT);

                res
                    .status(200)
                    .contentType("text/plain")
                    .redirect('back');
            });
        });
    }
);

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});
