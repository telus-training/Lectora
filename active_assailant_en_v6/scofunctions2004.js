/*******************************************************************************
** 
** Filename: SCOFunctions2004.js
**
** File Description: This file contains several JavaScript functions that are 
**                   used by the Sample SCOs contained in the Sample Course.
**                   These functions encapsulate actions that are taken when the
**                   user navigates between SCOs, or exits the Lesson.
**
** Author: ADL Technical Team
**
** Contract Number:
** Company Name: CTC
**
** Design Issues:
**
** Implementation Issues:
** Known Problems:
** Side Effects:
**
** References: ADL SCORM
**
********************************************************************************
**
** Concurrent Technologies Corporation (CTC) grants you ("Licensee") a non-
** exclusive, royalty free, license to use, modify and redistribute this
** software in source and binary code form, provided that i) this copyright
** notice and license appear on all copies of the software; and ii) Licensee
** does not utilize the software in a manner which is disparaging to CTC.
**
** This software is provided "AS IS," without a warranty of any kind.  ALL
** EXPRESS OR IMPLIED CONDITIONS, REPRESENTATIONS AND WARRANTIES, INCLUDING ANY
** IMPLIED WARRANTY OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE OR NON-
** INFRINGEMENT, ARE HEREBY EXCLUDED.  CTC AND ITS LICENSORS SHALL NOT BE LIABLE
** FOR ANY DAMAGES SUFFERED BY LICENSEE AS A RESULT OF USING, MODIFYING OR
** DISTRIBUTING THE SOFTWARE OR ITS DERIVATIVES.  IN NO EVENT WILL CTC  OR ITS
** LICENSORS BE LIABLE FOR ANY LOST REVENUE, PROFIT OR DATA, OR FOR DIRECT,
** INDIRECT, SPECIAL, CONSEQUENTIAL, INCIDENTAL OR PUNITIVE DAMAGES, HOWEVER
** CAUSED AND REGARDLESS OF THE THEORY OF LIABILITY, ARISING OUT OF THE USE OF
** OR INABILITY TO USE SOFTWARE, EVEN IF CTC  HAS BEEN ADVISED OF THE
** POSSIBILITY OF SUCH DAMAGES.
**
*******************************************************************************/
var finishCalled = false;
var autoCommit = false;

function MySetValue( lmsVar, lmsVal ) {
  var titleMgr = getTitleMgrHandle();
  if( titleMgr ) titleMgr.setVariable(lmsVar,lmsVal,0)
  LMSSetValue( lmsVar, lmsVal )
}

function loadPage() {
  var startDate = readVariable( 'TrivantisSCORMTimer', 0 );
  if( startDate == 0 || !LMSIsInitialized() ) {
    var result = LMSInitialize();
    var status = new String( LMSGetValue( "cmi.completion_status" ) );
    status = status.toLowerCase();
    if ( (status == "not attempted") || (status == "unknown") || (status == "incomplete"))
    {
        var mode = new String( LMSGetValue( "cmi.mode" ) );
        mode = mode.toLowerCase()
        if ( mode != "review"  &&  mode != "browse" ) MySetValue( "cmi.exit", "suspend" );
        MySetValue( "cmi.completion_status", "incomplete" );
        LMSCommit();
    }
    startTimer();
    return true;
  }
  else return false;
}

function startTimer() {
  var startDate = new Date().getTime();
  saveVariable('TrivantisSCORMTimer',startDate)
}

function computeTime() {
  var startDate = readVariable( 'TrivantisSCORMTimer', 0 )
  if ( startDate != 0 ) {
    var currentDate = new Date().getTime();
    var elapsedMills = currentDate - startDate;
    var formattedTime = convertTotalMills( elapsedMills );
  }
  else formattedTime = "P0H0M0S";
  MySetValue( "cmi.session_time", formattedTime );
}

function doBack() {
  computeTime();
  saveVariable( 'TrivantisEPS', 'T' );
  var result;
  result = LMSCommit();
  finishCalled = true;
  result = LMSFinish();
  saveVariable( 'TrivantisSCORMTimer', 0 );
}

function doContinue( status ) {
  var mode = new String( LMSGetValue( "cmi.mode" ) );
  mode = mode.toLowerCase()
  if ( mode != "review"  &&  mode != "browse" ) MySetValue( "cmi.success_status", status );
  computeTime();
  saveVariable( 'TrivantisEPS', 'T' );
  var result;
  result = LMSCommit();
  finishCalled = true;
  result = LMSFinish();
  saveVariable( 'TrivantisSCORMTimer', 0 );
}

function doQuit(bForce){
  computeTime();
  saveVariable( 'TrivantisEPS', 'T' );
  
  LMSSetValue( 'adl.nav.request', 'exit' ); 
  var result;
  result = LMSCommit();
  finishCalled = true;
  result = LMSFinish();
  saveVariable( 'TrivantisSCORMTimer', 0 );
  if( bForce && window.myTop ) window.myTop.close()
}

function unloadPage(bForce, titleName) {
  var exitPageStatus = readVariable( 'TrivantisEPS', 'F' );
  if (exitPageStatus != 'T') {
    if( window.name.length > 0 && window.name.indexOf( 'Trivantis_' ) == -1 )
      trivScormQuit(bForce, titleName, false);
  }
  else if( finishCalled != true && autoCommit == true ) {
    computeTime();
    LMSCommit();
  }
  
  saveVariable( 'TrivantisEPS', 'F' );
}

function convertTotalMills(ts) {
  var Sec  = 0;
  var Min  = 0;
  var Hour = 0;
  var Day  = 0;
  while( ts >= 3600000 ) {
    Hour += 1;
    ts -= 3600000;
  }
  while( ts >= 60000 ){
    Min += 1;
    ts -= 60000;
  }
  while ( ts >= 1000 ){
    Sec += 1;
    ts -= 1000;
  }
  while( Hour >= 24 ){
    Day += 1;
    Hour -= 24;
  }
  var rtnVal = 'P';
  if( Day > 0 ) rtnVal += Day + 'D';
  rtnVal += 'T'+Hour+'H'+Min+'M'+Sec+'S';
  return rtnVal;
}

function putSCORMInteractions(id,obj,tim,typ,crsp,wgt,lrsp,res,lat,desc) {
  var nextInt = parseInt( LMSGetValue( 'cmi.interactions._count' ), 10 )
  var root    = 'cmi.interactions.' + nextInt
  if(id)   LMSSetValue( root + '.id', Encode(id) )
  if(obj)  LMSSetValue( root + '.objectives.0.id', obj )
  if(tim)  LMSSetValue( root + '.timestamp', tim )
  if(typ)  LMSSetValue( root + '.type', typ )
  if(crsp) LMSSetValue( root + '.correct_responses.0.pattern', crsp )
  LMSSetValue( root + '.weighting', wgt )
  if(lrsp) LMSSetValue( root + '.learner_response', lrsp )
  if(res)  LMSSetValue( root + '.result', res )
  if(desc) LMSSetValue( root + '.description', desc )
  if(lat){
    var colonLoc = lat.indexOf( ':' )
    var Hour = parseInt( lat.substr( 0, colonLoc ), 10 )
    var Day  = 0;
    
    while( Hour >= 24 ){
      Day += 1;
      Hour -= 24;
    }
    
    lat = lat.substr( colonLoc + 1 )
    colonLoc = lat.indexOf( ':' )
    var Min  = lat.substr( 0, colonLoc )
    var Sec  = lat.substr( colonLoc + 1 )
    
    lat = 'P';
    if( Day ) lat += Day + 'D';
    lat += 'T'+Hour+'H'+Min+'M'+Sec+'S';    
    LMSSetValue( root + '.latency', lat )
  }
}

