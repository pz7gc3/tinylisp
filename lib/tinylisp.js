/*
** These functions are working on tokens
*/
function isLiteral(tok) { return tok!=undefined && tok.type === 'literal'  }
function isRegexp(tok) { return tok!=undefined && tok.type === 'regexp'  }
function isList(tok) { return tok!=undefined && tok.type === 'list'  }
function isFunction(tok) { return isList(tok) && tok.fnName != ''  }

/*
** Literal constructor
*/
function Literal(val) {
  this.type = 'literal';
  this.value = val;
}

/*
** List constructor
*/
function List(val) {
  this.type = 'list';
  this.fn = null;
  this.fnName = null;
  this.items = [];
}

function evalToken(env, token) {
  if (isLiteral(token)) {
    
    // Nothing to efvaluate. Just return the value
    return token.value;
    
  } else if (isFunction(token)) {
    
    // Lets see what the cat dragged in. Do we find the function in 
    // the provided environment
    if (env[token.fnName] === undefined) throw "Unknown function: " + token.fnName;
    
    // BTW, This lookup is case sensitive..
    var fn = env[token.fnName];
        
    // Extract values from the tokens into this list
    // The values can be any valid JavaScript value
    var args = [];
    for (var i=0; i<token.items.length; i++) {
      var item = token.items[i];
      args.push( evalToken(env, item) );
    }
    
    /* Call the JS function (with native) arguments */    
    return fn.apply(env, args);
             
  } else {
    
    return null;
    // throw "Not a valid token: " + token;
  }
}

/*
** Evaluate input (which is supposed to be token(s))
*/
function eval(env, input) {  
  var tokens = [];
  if (Array.isArray(input)) {
    tokens = input;
  } else if (isLiteral(input) || isList(input) || isFunction(input)) {
    tokens.push(input);      
  } else if (typeof input === 'string') {
    tokens = tokenize(input);
  } else {
    throw "Unsupported input: " + typeof input;
  }
  
  var result = [];
  tokens.map(function (tok, idx) {
    result.push( evalToken(env, tok) );      
  })
  
  if (result.length===1)
    return result[0];
  else
    return result;
}

/*
** Tokenize a string
*/
function tokenize (str) {
  var idx=0;
  
  var inList=false; // if true ==> we are reading a list
  // var inRex=false;
  
  var rex_ws = /\s/;
  var rex_lit = /[^\s\(\)\/'"]/;   // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
  
  function isWS(c) { return !!c.match(rex_ws); }
  function isLit(c) { return !!c.match(rex_lit); }
    
  function charAt(pos) {  return (pos<str.length ? str[pos] : '\0'); }
  
  /*
  ** Consume white space and andvance the current position 
  ** in the input buffer
  */
  function consumeWS() {  
      while (idx<str.length) {
          if (! isWS(str[idx]))
            break;            
          idx++;
      }
  }

  function parseLiteral(env, tokens) {
      if (! (idx<str.length)) return;
      var c=str[idx];
      var isQuoted = (c==='\'' || c==='"');
      var quote=(isQuoted?c:'');
      
      var start=idx;
      if (isQuoted) {
          
          idx++;
          start=idx;
          while (idx<str.length && quote!==str[idx]) {
            idx++;  
          }
          tokens.push( new Literal(str.substring(start, idx)) );
          if (quote===str[idx]) idx++;

      } else {

          start=idx;
          while (idx<str.length && isLit(str[idx])) { idx++; }
          tokens.push( new Literal(str.substring(start, idx)) );
          
      }
  }

  function parseRegexp(env, tokens) {
    throw "Not yet implemented: parseRegexp";
  }
    
  function parseList(env, tokens) {
    /*
    ** In this tiny lisp dialect a function is always 
    ** of the form
    **  
    ** '(' 'name' <args> ')'
    */
    var tok = new List()
    tokens.push(tok);
    
    // A new (sub) environment
    // Should really be extended.. (later)
    var scope = { parent: env };
    read(scope, tok.items);

    // Note if ast.length > 0 then the first argument 
    // is the name of a function (unless it is a function
    // itself. That is for later however...)
    if (tok.items.length>0) {
      var first = tok.items.shift();      
      if (first.fn || first.fnName) {
        // Oooh, it is already a function
        // Lets handle this later...
      } else {
        if (!isLiteral(first)) throw "This first item must be the name of a function";
        tok.fnName = first.value; // FIX I need to make the tokens real objects with constructors and so...
      }             
    }
     
  }
  
  function read(env, tokens) {
      while (idx<str.length) {
        consumeWS();
        
        if (idx<str.length) {
            var c = charAt(idx);
            if (c==='(') {
                idx++;
                inList = true;

                parseList(env, tokens);
            } else if (c===')') {
                idx++;
                inList = false;
                
                return;        
            } else {
                parseLiteral(env, tokens);
            }            
        }
      }
      
      if (inList) throw "List is not closed. Is the final ')' missing?";      
  }
  
  var ctx = {}; // For now
  var tokens = [];
  while (idx<str.length) {
      read(ctx, tokens);
  }
  return tokens;
}

exports.tokenize = tokenize;
exports.eval = eval;
