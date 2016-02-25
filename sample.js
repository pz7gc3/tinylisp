var parser = require('./lib/tinylisp');

/*
** Sample 1. Define a simple print function and call it through tinylisp
*/
console.log('> (print Hello)');
console.log('======================================\n');

var env = { print: console.log }
var input = " (print Hello) ";
var func = parser.tokenize(input);
parser.eval(env, func);
console.log('\n\n');


/*
** Sample 2. Define the upper to mean uppercase the input.
**           Run the sample. Note, one argument is not uppercased
*/
console.log('> (upper Foo) (upper \'å ä ö\') "M1x e\t\td!"');
console.log('======================================\n');

var env2 = {
  // upper: function(s) { return s.toUpperCase(); }
  upper: s => s.toUpperCase(),   // ES6 is beautiful!!
  len: s => s.length
};
var input2 = parser.tokenize('(upper Foo) (upper \'å ä ö\') "M1x e\t\td!"');
var result = parser.eval(env2, input2);
result.forEach( s => console.log(s) );
console.log('\n\n');

/*
** Sample 3. The eval function evaluates input provided as a string directly
*/
console.log('> (upper Fun)');
console.log('======================================\n');

var result3 = parser.eval(env2, '(upper Fun)');
console.log( result3 );
console.log('\n\n');

/*
** Sample 4. The eval function evaluates input provided as a string directly
*/
console.log('> (len (upper Fun))');
console.log('======================================\n');

var result4 = parser.eval(env2, '(len (upper Fun))');
console.log( result4 );
