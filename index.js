require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = require('./Config/db');
const db = require('./models');
const { route } = require('./UserRoute/StudentAttendanceRoute');

const app = express();

// ================= GLOBAL ERROR HANDLERS =================
process.on('unhandledRejection', (error) => {
    console.error('\n❌ UNHANDLED REJECTION:', error.message);
    console.error(error.stack);
});

process.on('uncaughtException', (error) => {
    console.error('\n❌ UNCAUGHT EXCEPTION:', error.message);
    console.error(error.stack);
    setTimeout(() => process.exit(1), 1000);
});

process.on('warning', (warning) => {
    console.warn('\n⚠️ WARNING:', warning.message);
});

process.on('SIGTERM', () => { console.log('\n📌 SIGTERM received - Shutting down...'); process.exit(0); });
process.on('SIGINT', () => { console.log('\n📌 SIGINT received - Shutting down...'); process.exit(0); });

// ================= MIDDLEWARE =================
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`\n📌 [${new Date().toISOString()}] ${req.method} ${req.url}`);
    const originalSend = res.send;
    res.send = function(data) {
        console.log(`📌 Response: ${res.statusCode} - ${Date.now() - start}ms`);
        if (res.statusCode >= 400) console.error(`❌ Error Response: ${data}`);
        return originalSend.call(this, data);
    };
    next();
});

app.use(cors());
app.use(express.json({ limit: '10gb' }));
app.use(express.urlencoded({ extended: true, limit: '10gb' }));

// ================= IMPORT ROUTES =================
console.log('\n📌 Loading Routes...');

let routeImports = {};
try { routeImports.userRoutes = require('./UserRoute/Route'); } catch(e) { console.error('❌ userRoutes:', e.message); }
try { routeImports.studentRoutes = require('./UserRoute/StudentRoute'); } catch(e) { console.error('❌ studentRoutes:', e.message); }
try { routeImports.studentTableRoute = require('./UserRoute/StudentTableroute'); } catch(e) { console.error('❌ studentTableRoute:', e.message); }
try { routeImports.classRoute = require('./UserRoute/classRoute'); } catch(e) { console.error('❌ classRoute:', e.message); }
try { routeImports.TeacherRoute = require('./UserRoute/TeacherRoute'); } catch(e) { console.error('❌ TeacherRoute:', e.message); }
try { routeImports.CreatedClassroute = require('./UserRoute/CreatedClassroute'); } catch(e) { console.error('❌ CreatedClassroute:', e.message); }
try { routeImports.SubjectRoute = require('./UserRoute/SubjectRoute'); } catch(e) { console.error('❌ SubjectRoute:', e.message); }
try { routeImports.TeachertoSubjectRoute = require('./UserRoute/TeachertoSubjectRoute'); } catch(e) { console.error('❌ TeachertoSubjectRoute:', e.message); }
try { routeImports.MarkRoute = require('./UserRoute/MarksRoute'); } catch(e) { console.error('❌ MarkRoute:', e.message); }
try { routeImports.FeeRoute = require('./UserRoute/FeeRoute'); } catch(e) { console.error('❌ FeeRoute:', e.message); }
try { routeImports.DashboardRoute = require('./UserRoute/DashboardRoute'); } catch(e) { console.error('❌ DashboardRoute:', e.message); }
try { routeImports.ReportRoute = require('./UserRoute/ReportRoute'); } catch(e) { console.error('❌ ReportRoute:', e.message); }
try { routeImports.AuthRoute = require('./UserRoute/AuthRoute'); } catch(e) { console.error('❌ AuthRoute:', e.message); }
try { routeImports.ReportCardRoute = require('./UserRoute/ReportCardRoute'); } catch(e) { console.error('❌ ReportCardRoute:', e.message); }
try { routeImports.AttendanceRoute = require('./UserRoute/AttendanceRoute'); } catch(e) { console.error('❌ AttendanceRoute:', e.message); }
try { routeImports.TimetableRoute = require('./UserRoute/TimetableRoute'); } catch(e) { console.error('❌ TimetableRoute:', e.message); }
try { routeImports.UsersRoute = require('./UserRoute/UsersssRoute'); } catch(e) { console.error('❌ UsersRoute:', e.message); }
try { routeImports.ClassSubjectRoute = require('./UserRoute/ClassSubjectRoute'); } catch(e) { console.error('❌ ClassSubjectRoute:', e.message); }
try { routeImports.NotificationRoute = require('./UserRoute/NotificationRoute'); } catch(e) { console.error('❌ NotificationRoute:', e.message); }
try { routeImports.TeacherAttendanceRoute = require('./UserRoute/TeacherAttendanceRoute'); } catch(e) { console.error('❌ TeacherAttendanceRoute:', e.message); }
try { routeImports.SMSRoute = require('./UserRoute/SMSRoute'); } catch(e) { console.error('❌ SMSRoute:', e.message); }
console.log('📌 SMSRoute loaded:', routeImports.SMSRoute ? '✅ Yes' : '❌ No');
if (routeImports.SMSRoute) {
  console.log('📌 SMSRoute type:', typeof routeImports.SMSRoute);
}
try { routeImports.SettingsRoute = require('./UserRoute/SettingsRoute'); } catch(e) { console.error('❌ SettingsRoute:', e.message); }
try { routeImports.ReportAnalyticsRoute = require('./UserRoute/ReportAnalyticsRoute'); } catch(e) { console.error('❌ ReportAnalyticsRoute:', e.message); }
try{ routeImports.StudentAttendanceRoute = require('./UserRoute/StudentAttendanceRoute');} catch(e) {console.error('❌ StudentAttendanceRoute:', e.message)}
try { routeImports.requirementRoute = require('./UserRoute/requirementRoute'); } catch(e) { console.error('❌ requirementRoute:', e.message); }
try { routeImports.PaymentRoute = require('./UserRoute/PaymentRoute');} catch(e) {console.error('❌  PaymentRoute"', e.message);}
try { routeImports.TeacherSalaryRoute = require('./UserRoute/TeacherSalaryRoute'); } catch(e) { console.error('❌ TeacherSalaryRoute:', e.message); }
// ----- NEW: load contact routes -----
try { routeImports.contactRoutes = require('./UserRoute/contactRoutes'); } catch(e) { console.error('❌ contactRoutes:', e.message); }
try { routeImports.PromotionRoute = require('./UserRoute/PromotionRoute'); } catch(e) { console.error('❌ PromotionRoute:', e.message); }
try { routeImports.ClassTeacherRoute = require('./UserRoute/ClassTeacherRoute'); } catch(e) { console.error('❌ ClassTeacherRoute:', e.message); }
try { routeImports.ClassTeacherRoute = require('./UserRoute/ClassTeacherRoute'); } 
catch(e) { console.error('❌ ClassTeacherRoute:', e.message); }
try { routeImports.staffRoutes = require('./UserRoute/StaffRoute'); } catch(e) { console.error('❌ StaffRoute:', e.message); }

try { routeImports.staffSalaryRoutes = require('./UserRoute/StaffSalaryRoute'); } catch(e) { console.error('❌ StaffSalaryRoute:', e.message); }


console.log('\n🔍 Checking route imports:');
Object.entries(routeImports).forEach(([name, route]) => {
    if (typeof route === 'function') {
        console.log(`✅ ${name} is a function`);
    } else if (route && typeof route === 'object') {
        console.log(`✅ ${name} is an object`);
        if (route.router) console.log(`   📌 Has .router property`);
        if (route.default) console.log(`   📌 Has .default property`);
    } else {
        console.error(`❌ ${name} is NOT a function! Type: ${typeof route}`);
    }
});

// ================= TEST ROUTES =================
app.get('/', (req, res) => { res.json({ message: 'Backend is running', timestamp: new Date().toISOString() }); });
app.get('/health', (req, res) => { res.json({ status: 'ok', uptime: process.uptime(), node_version: process.version }); });
app.get('/test-db', async (req, res, next) => {
    try {
        const results = await pool.query('SELECT NOW()');
        res.json({ success: true, message: 'Database connected', time: results.rows[0].now });
    } catch (error) { next(error); }
});

// ================= REGISTER ROUTES =================
console.log('\n📝 Registering routes:');

const registerRoute = (path, route, routeName) => {
    try {
        if (!route) {
            console.error(`❌ Failed: ${path} - Route is null/undefined`);
            return false;
        }
        let routerToUse = null;
        if (typeof route === 'function') routerToUse = route;
        else if (route && typeof route === 'object' && route.router) routerToUse = route.router;
        else if (route && typeof route === 'object' && typeof route.default === 'function') routerToUse = route.default;
        
        if (routerToUse && typeof routerToUse === 'function') {
            app.use(path, routerToUse);
            console.log(`✅ Route registered: ${path} (${routeName})`);
            return true;
        } else {
            console.error(`❌ Failed: ${path} - Invalid router type: ${typeof routerToUse}`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error registering ${path}:`, error.message);
        return false;
    }
};

// ===== ROUTE REGISTRATIONS =====
const routeRegistrations = [
    { path: '/api/auth', route: routeImports.AuthRoute, name: 'AuthRoute' },
    { path: '/api/students', route: routeImports.studentRoutes, name: 'studentRoutes' },
    { path: '/api/students-table', route: routeImports.studentTableRoute, name: 'studentTableRoute' },
    { path: '/api/classes', route: routeImports.classRoute, name: 'classRoute' },
    { path: '/api/classes', route: routeImports.CreatedClassroute, name: 'CreatedClassroute' },
    { path: '/api/teachers', route: routeImports.TeacherRoute, name: 'TeacherRoute' },
    { path: '/api/subjects', route: routeImports.SubjectRoute, name: 'SubjectRoute' },
    { path: '/api/teacher-subjects', route: routeImports.TeachertoSubjectRoute, name: 'TeachertoSubjectRoute' },
    { path: '/api/marks', route: routeImports.MarkRoute, name: 'MarkRoute' },
    { path: '/api/fees', route: routeImports.FeeRoute, name: 'FeeRoute' },
    { path: '/api/dashboard', route: routeImports.DashboardRoute, name: 'DashboardRoute' },
    { path: '/api/reports', route: routeImports.ReportRoute, name: 'ReportRoute' },
    { path: '/api/report-cards', route: routeImports.ReportCardRoute, name: 'ReportCardRoute' },
    { path: '/api/attendance', route: routeImports.AttendanceRoute, name: 'AttendanceRoute' },
    { path: '/api/timetables', route: routeImports.TimetableRoute, name: 'TimetableRoute' },
    { path: '/api/users', route: routeImports.UsersRoute, name: 'UsersRoute' },
    { path: '/api/class-subjects', route: routeImports.ClassSubjectRoute, name: 'ClassSubjectRoute' },
    { path: '/api/notifications', route: routeImports.NotificationRoute, name: 'NotificationRoute' },
    { path: '/api/teacher-attendance', route: routeImports.TeacherAttendanceRoute, name: 'TeacherAttendanceRoute' },
    { path: '/api/sms', route: routeImports.SMSRoute, name: 'SMSRoute' },
    { path: '/api/requirements', route: routeImports.requirementRoute, name: 'requirementRoute' },
    { path: '/api/settings', route: routeImports.SettingsRoute, name: 'SettingsRoute' },
    { path: '/api/report-analytics', route: routeImports.ReportAnalyticsRoute, name: 'ReportAnalyticsRoute' },
    { path: '/api/studentattendance', route: routeImports.StudentAttendanceRoute, name: 'StudentAttendanceRoute' },
        { path: '/api/teacher-salaries', route: routeImports.TeacherSalaryRoute, name: 'TeacherSalaryRoute' },
    // ----- NEW: contact routes -----
    { path: '/api/contacts', route: routeImports.contactRoutes, name: 'contactRoutes' },
    { path: '/api/promotions', route: routeImports.PromotionRoute, name: 'PromotionRoute' },
    { path: '/api/class-teacher', route: routeImports.ClassTeacherRoute, name: 'ClassTeacherRoute' },
    { path: '/api/class-teacher', route: routeImports.ClassTeacherRoute, name: 'ClassTeacherRoute' },
    {path: '/api/payment', route: routeImports.PaymentRoute, name: 'PaymentRoute'},
   { path: '/api/staff', route: routeImports.staffRoutes, name: 'StaffRoute' },
{ path: '/api/staff-salaries', route: routeImports.staffSalaryRoutes, name: 'StaffSalaryRoute' }

];

let successfulRoutes = 0;
let failedRoutes = 0;

routeRegistrations.forEach(({ path, route, name }) => {
    const success = registerRoute(path, route, name);
    if (success) successfulRoutes++;
    else failedRoutes++;
});

console.log(`\n📊 Route Registration Summary: ✅ ${successfulRoutes} | ❌ ${failedRoutes}`);

// 404 handler
app.use((req, res) => {
    console.warn(`⚠️ 404 Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ success: false, error: `Route ${req.method} ${req.url} not found` });
});

// ================= GLOBAL ERROR HANDLER =================
app.use((err, req, res, next) => {
    console.error('\n❌ EXPRESS ERROR:', err.message);
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        console.log('\n📌 Attempting to sync database...');
        await db.sequelize.sync({ alter: false });
        console.log('✅ Database synced successfully');

        // ===== CREATE DEFAULT SMS BALANCE =====
        try {
            const balance = await db.SmsBalance.findOne();
            if (!balance) {
                await db.SmsBalance.create({
                    balance: 1000,
                    totalPurchased: 0,
                    totalUsed: 0,
                    totalSpent: 0
                });
                console.log('✅ Default SMS balance created (1000 SMS)');
            } else {
                console.log('✅ SMS balance already exists:', balance.balance);
            }
        } catch (error) {
            console.log('⚠️ SMS balance error:', error.message);
        }
        
        const server = app.listen(PORT, () => {
            console.log(`\n✅ Server running on port ${PORT}`);
            console.log(`🔗 API URL: http://localhost:${PORT}/api`);
            console.log(`🔗 Test API: http://localhost:${PORT}/test-db`);
            console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
            console.log(`\n📌 Server started at: ${new Date().toISOString()}`);
            console.log('📌 Yoola API Key loaded:', process.env.YOOLA_API_KEY ? '✅ Yes' : '❌ No');
            console.log('📌 Yoola Base URL:', process.env.YOOLA_BASE_URL || 'Using default');
        });

        server.on('error', (error) => {
            console.error('\n❌ SERVER ERROR:', error.message);
            if (error.code === 'EADDRINUSE') {
                console.error(`📌 Port ${PORT} is already in use!`);
            }
        });

        return server;
    } catch (error) {
        console.error('\n❌ DATABASE SYNC ERROR:', error.message);
        console.error(error.stack);
        setTimeout(() => process.exit(1), 1000);
    }
};

startServer();

console.log('\n📌 Server initialization started...');