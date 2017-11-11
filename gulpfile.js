const gulp = require("gulp");
const ts = require("gulp-typescript");
const ASSET_FILES = [ "src/*.json", "src/**/*.json", "src/**/*.html", "src/*.html" ];

// pull in the project TypeScript config
const tsProject = ts.createProject("tsconfig.json");

gulp.task("build", () => {
  const tsResult = tsProject.src()
    .pipe(tsProject());
  
    tsResult.js.pipe(gulp.dest("built"));

  gulp.src(ASSET_FILES)
    .pipe(gulp.dest("built"));
});
