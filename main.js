/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, regexp: true */
/*global define, brackets, $, window */




define(function (require, exports, module) {
            "use strict";

            var AppInit = brackets.getModule("utils/AppInit"),
                CodeHintManager = brackets.getModule("editor/CodeHintManager"),
                ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
                TokenUtils = brackets.getModule("utils/TokenUtils"),
                LanguageManager = brackets.getModule("language/LanguageManager");

            var AppInit = brackets.getModule('utils/AppInit');


            var lastLine,
                lastFileName,
                cachedMatches,
                cachedWordList,
                tokenDefinition,
                currentTokenDefinition;


            function getTokenToCursor(token) {
                var tokenStart = token.token.start,
                    tokenCursor = token.pos.ch,
                    tokenString = token.token.string;
                return tokenString.substr(0, (tokenCursor - tokenStart));
            }



            /**
             * @constructor
             */
            function Csshints() {
                this.activeToken = "";
                this.cachedCssColours = [];
                this.cachedLocalVariables = [];
                this.tokenVariable = /^((0x){0,1}|#{0,1})([0-9A-F]{8}|[0-9A-F]{6})$/gi;
                this.currentTokenDefinition = /[#][A-Za-z0-9]+/gi;
                this.newUserVarSession = false;
            }



            Csshints.prototype.hasHints = function (editor, implicitChar) {
                this.editor = editor;
                var i = 0,
                    cursor = editor.getCursorPos(),
                    //i use  token cause  i think  is easy  to  understand 
                    tokenToCursor = "";

                this.activeToken = TokenUtils.getInitialContext(editor._codeMirror, cursor);

                // if implicitChar or 1 letter token is #, we *always* have hints so return immediately
                if (implicitChar === "#" || this.activeToken.token.string.charAt(0) === "#") {
                    //for the starting session to understand better  you  can visit http://brackets.io/docs/current/modules/editor/CodeHintManager.html
                    //but  to  make  it simple  am  just  trying  make  know  that  a new  hint session  has started
                    this.newUserVarSession = true;
                    
                    return true;
                }

                tokenToCursor = getTokenToCursor(this.activeToken);

                // if we entre  a  world  like  #f not just # then  we should  be able  to still read it
                //if your a  dev  you can try  to  remove this part to  understand better  by the way  the   plugin  is responding
                var lineBeginning = {
                    line: cursor.line,
                    ch: 0
                };
                var textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);
                var symbolBeforeCursorArray = textBeforeCursor.match(this.currentTokenDefinition);
                if (symbolBeforeCursorArray) {
                    // if the half-word inputed correspond  to our match  then  we have  a hint
                    console.clear();
                    console.log("we have   hint here  too  at  the middle");
                    this.newUserVarSession = true;
                    
                    return true;
                }


                // nope, no hints
                return false;
            };


            /**
             * Returns a list of availble CSS propertyname or -value hints if possible for the current
             * editor context. 
             * 
             * @param {Editor} implicitChar 
             * Either null, if the hinting request was explicit, or a single character
             * that represents the last insertion and that indicates an implicit
             * hinting request.
             *
             * @return {jQuery.Deferred|{
             *              hints: Array.<string|jQueryObject>,
             *              match: string,
             *              selectInitial: boolean,
             *              handleWideResults: boolean}}
             * Null if the provider wishes to end the hinting session. Otherwise, a
             * response object that provides:
             * 1. a sorted array hints that consists of strings
             * 2. a string match that is used by the manager to emphasize matching
             *    substrings when rendering the hint list
             * 3. a boolean that indicates whether the first result, if one exists,
             *    should be selected by default in the hint list window.
             * 4. handleWideResults, a boolean (or undefined) that indicates whether
             *    to allow result string to stretch width of display.
             */


            Csshints.prototype.getHints = function (implicitChar) {
        
                
                var i = 0,
                    hintList = [],
                    localVarList = [],
                    cursor = this.editor.getCursorPos(),
                    tokenToCursor = "";

                this.activeToken = TokenUtils.getInitialContext(this.editor._codeMirror, cursor);
                tokenToCursor = getTokenToCursor(this.activeToken);


                // if it's a css color  then we just search  in our css file  and take the code out and add it to  varlist
                if (implicitChar === "#" || this.activeToken.token.string.charAt(0) === "#") {
                         
                    //also  checking  if a session  have been  started  before searching  just in case
                    if (this.newUserVarSession) {
                        this.cachedLocalVariables.length = 0;
                        var varList = this.editor.document.getText().match(this.tokenVariable);
                        
                        if (varList) {
                            for (i = 0; i < varList.length; i++) {
                                var word = varList[i];
                                if (this.cachedLocalVariables.indexOf(word) === -1) {
                                    this.cachedLocalVariables.push(word);
                                }
                            }
                        }
                    }
                    this.newUserVarSession = false;

                    if (this.cachedLocalVariables === null) {
                        return null;
                    }
                    hintList = this.cachedLocalVariables;

                    return {
                        hints: hintList,
                        match: false,
                        selectInitial: true,
                        handleWideResults: false
                    };
                };
                    
            };
                    /**
                     * Complete the word
                     * 
                     * @param {String} hint 
                     * The hint to be inserted into the editor context.
                     * 
                     * @return {Boolean} 
                     * Indicates whether the manager should follow hint insertion with an
                     * additional explicit hint request.
                     */
                    Csshints.prototype.insertHint = function (hint) {

                        // am   using  the currentTokenDefinition for my regex cause i dont want to  limite the search  
                        var cursor = this.editor.getCursorPos();
                        var lineBeginning = {
                            line: cursor.line,
                            ch: 0
                        };
                        var textBeforeCursor = this.editor.document.getRange(lineBeginning, cursor);
                        var indexOfTheSymbol = textBeforeCursor.search(this.currentTokenDefinition);
                        var replaceStart = {
                            line: cursor.line,
                            ch: indexOfTheSymbol
                        };
                        this.editor.document.replaceRange(hint, replaceStart, cursor);


                        return false;
                    };









                    //finially  just finishing
                    AppInit.appReady(function () {
                        console.log("backet  css  color finder just started");
                        var csshints = new Csshints();
                        CodeHintManager.registerHintProvider(csshints, ["all"], 10);

                    });
                });
