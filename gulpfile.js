const gulp = require('gulp');
const webserver = require('gulp-webserver');

gulp.task('webserver', function () {
    gulp.src('.') // 公開したい静的ファイルを配置したディレクトリを指定する
        .pipe(webserver({
            host: 'localhost',
            port: 8000,
            livereload: true
        }));
});
