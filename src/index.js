//
const path          = require('path');
const express       = require('express');
const morgan        = require('morgan');
const compression   = require('compression');
const session       = require('express-session');
const flash         = require('connect-flash')
//Phương thức [PUT]:để chỉnh sửa nhưng chưa hỗ trợ nên sử dụng [PUT]
//sẽ bị chuyển thành [GET] nên h phải dùng middleware
const methodOverride = require('method-override');


const route = require('./routes');
const db    = require('./config/db');


// connect to DB
db.connect();

const app   = express();
const port  = 3000;

// Flash setup
app.use(session({
    secret: 'secret',
    cookie: { maxAge: 10000 },
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_message = req.flash('success-message')
    res.locals.error_message = req.flash('error-message')
    next();
})

// Compression
app.use(compression({
    level: 6,
    threshold: 0, // 100 * 1000 Dưới 100KB không bị compress
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            // don't compress responses with this request header
            return false
        } else {
            return compression.filter(req, res)
        }
    }
}))

// Defind Static path
app.use(express.static(path.join(__dirname, 'public')));

//add cái này cho form (post) parse ra dạng kiểu dữ liệu cho console.log
app.use(express.urlencoded({
        extended: true,
    }),
);
app.use(express.json());



// HTTP logger
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));

// method override
app.use (methodOverride('_method'));

//Template engine: express handlebars (add partial parts)
const handlebars = require('express-handlebars');
app.engine(
    'hbs',
    handlebars.create({
        defaultLayout: 'main',
        layoutsDir: path.join(__dirname, "resources/views/layouts"),
        partialsDir: path.join(__dirname, "resources/views/partials"),
        extname: '.hbs',
          //Hàm tự thêm vào nhờ express handlebars
          helpers: {
            mySum: (a, b) =>  a + b,
            limit: (arr, limit) => {
                if (!Array.isArray(arr)) { return []; }
                return arr.slice(0, limit);
            },
            replaceHyphenIntoSpace: (str) => {
                str = str.toString().replace(/-/g, ' ');
                return  str;// replace '-' -> space 
               
            },
        }
    }).engine,
);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'resources', 'views')); //__dirname/resources/views

//Routes init
route(app);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
