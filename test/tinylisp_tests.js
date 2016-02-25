// Inspiration was picked from
// https://semaphoreci.com/community/tutorials/getting-started-with-node-js-and-mocha
var expect = require('chai').expect;
var parser = require('../lib/tinylisp');

// This is mocha stuff
describe("Tokenizing input", function(){
  
    // See http://chaijs.com/
    // for more on the syntax
    describe("Testing empty/insignificant input", function () {
        it("parses an empty input", function() {
          var ret1 = parser.tokenize('');          
          expect(ret1).to.be.empty;
        });

        it("ignores white space", function() {
          var ret1 = parser.tokenize(" \t");          
          expect(ret1).to.be.empty;

          var ret2 = parser.tokenize("\tbar ");          
          expect(ret2).to.have.lengthOf(1);
        });
    });
        
    describe("Testing literals", function () {
        it("parses a string literal", function(){

            var ret1 = parser.tokenize('foo');
            expect(ret1[0]).to.deep.equal({type: 'literal', value: 'foo'})      
            // or the same test written differently
            expect(ret1).to.have.deep.property('[0].type', 'literal');
            expect(ret1).to.have.deep.property('[0].value', 'foo');
              
            var ret3 = parser.tokenize(' %pvm? ');
            expect(ret3[0]).to.deep.equal({
              type: 'literal',
              value: '%pvm?'
            });            
        });

        it("parses a quoted string", function() {
          
          var tok1 = parser.tokenize('""');
          expect(tok1[0]).to.deep.equal({type: 'literal', value: ''})      

          var tok2 = parser.tokenize('"("');
          expect(tok2[0]).to.deep.equal({type: 'literal', value: '('})      

          var tok3 = parser.tokenize("'\"Me (and You)\"'");
          expect(tok3[0]).to.deep.equal({type: 'literal', value: '\"Me (and You)\"'})      

          var sql = parser.tokenize(" A = %STATUS AND 'count(*) > 0'");
          expect(sql).to.have.lengthOf(5);
          expect(sql).to.have.deep.property('[2].value', '%STATUS');
          expect(sql).to.have.deep.property('[4].value', 'count(*) > 0');
       });
        
    }); 

    describe("Testing lists", function () {

        it("parses an empty list", function() {
          var list = parser.tokenize('()') 
          expect(list).to.have.deep.property('[0].type', 'list');    
        });

        it("fails to parse a incomplete list", function() {
          var fn = function() { 
            parser.tokenize('(print a');  // No ')' at the end 
          };
          expect(fn).to.throw(/List is not closed/);    
        });

        it("parses a minimal function", function() {
          var minmal = parser.tokenize(' (print) ')
          expect(minmal).to.have.deep.property('[0].type', 'list');
          expect(minmal).to.have.deep.property('[0].fnName', 'print');
          expect(minmal[0].items).to.have.lengthOf(0);  // No items in list
        });
        
        it("parses a function with a literal", function() {
          var tok = parser.tokenize(' (unit System) ')[0];
          
          expect(tok).to.have.property('type', 'list');
          expect(tok).to.have.property('fnName', 'unit');
          expect(tok.items).to.have.lengthOf(1);  // No items in list
          expect(tok.items).to.have.deep.property('[0].type', 'literal');
          expect(tok.items).to.have.deep.property('[0].value', 'System');
        });
    });
        
});       


describe("Evaluating functions", function(){
    describe("Testing error handling", function () {
      
        it("detects a missing function", function() {
          var env = {}; // No functions at all
          
          var func = parser.tokenize(' (missing System) ')[0];
          expect(func).to.have.property('fnName', 'missing');
          
          var fn = function() {
            parser.eval(env, func);
          };
          
          expect(fn).to.throw(/Unknown function/);
        });
    });
    
    describe("Calling functions", function () {
      
        it("returns 'Hello World'", function() {
          var env= {
            /*
            ** This is the function that should get called
            ** once the input string is parsed and evaluated
            */
            input: function(s) { return s; }
          }; 
          
          var func = parser.tokenize(' (input "Hello World!") ')[0];
          expect(env).to.have.property('input');
          expect(func).to.have.property('fnName', 'input');
          
          var result = parser.eval(env, func);
          expect(result).to.equal('Hello World!');
        });
                      
        it("many inputs retuns many outputs", function() {
          var env= {
            upper: function(s) { return s.toUpperCase(); }
          }; 
          
          var input = parser.tokenize('(upper Foo) (upper åäö) "M1x ed!"');
          expect(input).to.have.lengthOf(3);
          
          var result = parser.eval(env, input);
          expect( result.length ).to.equal(3);
          expect( result[0] ).to.equal('FOO');
          expect( result[1] ).to.equal('ÅÄÖ');
          expect( result[2] ).to.equal('M1x ed!');
        });
        
        it("eval string directly", function() {
          var env= {
            upper: function(s) { return s.toUpperCase(); }
          }; 

          var result = parser.eval(env, '(upper Fun)');
          expect( result ).to.equal('FUN');        
        });
        
    });            
});