
/* STATE */

var niceScroll = false;
var textFile = null;
const state = {
  edit: 0,
  arrowTransformed: false,
  lastScrollPos: null,
}

/** HELPERS **/

function makeTextFile (text) {
  var data = new Blob([text], {type: 'text/plain'});

  // revoking the object URL to avoid memory leaks.
  if (textFile !== null) {
    window.URL.revokeObjectURL(textFile);
  }

  textFile = window.URL.createObjectURL(data);

  return textFile;
};

function isLocalFile(source) {
  return source
   && !(source.startsWith('data:image/')
   || source.startsWith('http://')
   || source.startsWith('https://'));
}

function resetArrow(){
  const arrow = $(".arrow-down")[0];
  arrow.classList.remove("arrow-up");
  state.arrowTransformed = false;
}


$(document).ready(function() {

  /** CONSTANTS & GLOBAL **/


  let H = $(window).height()
  let W = $(window).width()
  let containerHeight = window.innerHeight

  const IMG_PATH = "img/";
  const CONTENT_FILE = "content.js";
  const DARK_MODE = "dark"

  var lastContainerId = 0;
  var sectionLengthTracker = new Map()

  niceScroll = $("body").niceScroll({enablekeyboard: false});

  let editorTitle = $("#edit-title")
  let editorContent = $("#edit-content")
  let editorAuthor = $("#edit-author")
  let editorAuthorLink = $("#edit-author-link")
  let editorThemeLight = $("#editor-theme-light")[0]
  let editorThemeDark = $("#editor-theme-dark")[0]
  let downloadLink = $("#download-link")[0];

  render();

  /* move to section */
  if(state.lastScrollPos === null){
    const targetSection = window.location.hash
    if(targetSection && $(targetSection) && $(targetSection).offset()){
      $([document.documentElement, document.body]).animate({
          scrollTop: $(targetSection).offset().top,
      }, 0);
      }
  }

  enableTabsInTextArea();
  var imgWidth = $('.info-left'+' img') ? $('.info-left'+' img').width() : 0


  /*********** PRESENTATION WINDOW ***********/

  function render(){
    resetArrow()

    /** apply metadata **/

    let data = window.data;
    $("#author").text(window.author)
    $("#author").attr("href", window.authorLink);
    $("#presentation-name").text(window.title)
    if(window.theme==DARK_MODE){
      $("body").addClass("dark-mode")
    } else {
      $("body").removeClass("dark-mode")
    }

    /** apply content **/

    lastContainerId = 0;
    for(var j = 0;j<data.length;j++){
      
      //header
      const sectionId = (j > 0 ? lastContainerId : 0)
      const sectionPrevLength = (j > 0 ? data[j-1].content.length : 0)
      sectionLengthTracker.set(sectionId, sectionPrevLength)
      $("#main").append(
        '<section id="slide'+sectionId+'"> \
          <div id="heading"> \
            <h1>'+data[j].title+'</h1> \
          </div> \
        </section>'
      );
      lastContainerId++

      //sections
      var lastContainerIdTemp = 0
      const contentLength = data[j].content.length
      for(var i = lastContainerId; i < (lastContainerId+contentLength); i++){
          var dI = i - (lastContainerId)
          let imgFile = data[j].content[dI].image
          imgFile = isLocalFile(imgFile) ? IMG_PATH+imgFile : imgFile
          var imageContent = '<img src="'+imgFile+'">'
          
          //var subContentEdited = data[j].content[dI].content.replace("Problem", "<b>Problem</b>").replace("Solution", "<br><b>Solution</b>")
          subContentEdited = data[j].content[dI].content
          var textContent =
          '<div class="info-inner"> \
            <h2>'+data[j].content[dI].title+'</h2> \
            <p>'+subContentEdited+'</p> \
          </div>'

          leftContent = (i%2 == 0) ? imageContent : textContent
          rightContent = (i%2 == 0) ? textContent : imageContent

          $("#main").append(
          ' <section id="slide'+(i)+'"> \
              <div class="container-custom"> \
                <div class="row"> \
                  <div class="sub-container col-md-6 col-sm-6"> \
                  <div class="info-left">' +
                    leftContent
                  +'</div> \
                </div> \
                <div class="sub-container col-md-6 col-sm-6"> \
                  <div class="info-right">' +
                  rightContent
                    +'</div> \
                  </div> \
                </div> \
                </div> \
            </section> \
          ')
      lastContainerIdTemp = i
      }
      lastContainerId = i
    }
    $("footer").show()
    document.addEventListener('keydown', checkKey, true);
  }


  /** RESIZE LOGIC **/
  $(window).resize(function() {
    H = $(window).height()
    W = $(window).width()
    containerHeight = window.innerHeight
  });


  /** SCROLLING LOGIC **/
  $(window).scroll(function(){

    let scrollDelta, scrollDeltaPure;
    let nextSectionHash = 0;
    let sectionIsEven = 0;
    var scrollTop = $(this).scrollTop();
    var nwScroll = new Array(lastContainerId)

    for(var i = 0; i < nwScroll.length;i++){
      const isSectionHeader = sectionLengthTracker.has(i)
      if(isSectionHeader){   
        sectionIsEven = Math.abs(1 - (sectionLengthTracker.get(i) % 2))
      }
      var leftright = ((i+sectionIsEven) % 2) ? 'left' : 'right';
      var sign = ((i+sectionIsEven) % 2) ? '' : '-'
      var signNum = ((i+sectionIsEven) % 2) ? 1 : -1

      nextSectionHash = '#slide'+i;

      if($(nextSectionHash).offset()){
        scrollDelta = scrollTop - $(nextSectionHash).offset().top + H
        scrollDeltaPure = scrollDelta - H
        const prePosition = -(W/2)
        const postPosition = (imgWidth/2)
        const hDelta = (postPosition - prePosition)
        if(scrollDelta > 0){
          if(scrollDelta < H){

            /** image pos fade **/ 
            const pos = Math.min(-1*prePosition, - ( (postPosition) - (hDelta / (H/scrollDelta)) ) )
            $('#slide'+i+' .info-'+leftright+'').css({
                'left': signNum * prePosition + 'px',
                'transform' : 'translate('+sign+''+pos+'px, 0px)',
                //'opacity' : 1.0,
            });

            /** transform arrow **/
            if(i == lastContainerId - 1){
              if(scrollDelta > H/2){
                const arrow = $(".arrow-down")[0];
                arrow.classList.add("arrow-up");
                state.arrowTransformed = true;
              }
              else if(state.arrowTransformed){
                  resetArrow()
              }
            }
            if(window.currentElement == 0){
              resetArrow()
            }

          } else {
            if(!isSectionHeader){
              $('#slide'+i).css({
                  //'opacity' : 1.0 - (((scrollDeltaPure)/1000) * 2)
              });
            }
          }
        }

      }

    }
  });


  /** SCOLLING TRIGGER HANDLING **/
  function scrollingFunction (d=0) {
    const TIME = 1500;

    var nextSection = detectCurrentContainer(d)
    const nextSectionHash = "#slide"+nextSection
    const target = $(nextSectionHash)

    const footer = $("footer")
    if(footer.length > 0){
      footer[0].classList.remove('last-slide')
      if (nextSection == lastContainerId - 1) {
        footer[0].classList.add('last-slide')
      }
    }

    if(nextSection == 0){
      $([document.documentElement, document.body]).animate({
          scrollTop: 0
      }, 500);
    } else {
      $("body").getNiceScroll(0).doScrollTop(target.offset().top, TIME);
    }

    window.location.hash = nextSectionHash;
  }

  function detectCurrentContainer (d=0){
    var nextSectionDistance = 9999
    var nextSection = 0
    var i = d ? lastContainerId - 1 : 0
    var to = d ? 0 : lastContainerId
    var scrollPos = document.documentElement.scrollTop || document.body.scrollTop
    while(i != to){
      var scrollContainerDelta = ($("#slide"+i).offset().top - scrollPos)
      scrollContainerDelta *= d ? -1 : 1
      if((scrollContainerDelta < nextSectionDistance) && (scrollContainerDelta > 600)){
        nextSection = i
        nextSectionDistance = scrollContainerDelta
      }
      d ? i-- : i++ 
    }
    window.currentElement = nextSection
    return nextSection
  }

  /** SCOLLING TRIGGER 1: KEYS **/
  function checkKey(e) {
      //e.preventDefault()
      e = e || window.event;
      if (e.keyCode == '40' || e.keyCode == '39' || e.keyCode == '32') {
        scrollingFunction();
      } else if (e.keyCode == '38' || e.keyCode == '37') {
        scrollingFunction(1);
      }
  }

  /** SCOLLING TRIGGER 2: ARROW **/
  $("#scroller").click(scrollingFunction.bind(this, 0));

  /*********** EDIT WINDOW ***********/

  function enableTabsInTextArea(){
    var textareas = document.getElementsByTagName('textarea');
    var count = textareas.length;
    for(var i=0;i<count;i++){
        textareas[i].onkeydown = function(e){
            if(e.keyCode==9 || e.which==9){
                e.preventDefault();
                var s = this.selectionStart;
                this.value = this.value.substring(0,this.selectionStart) + "\t" + this.value.substring(this.selectionEnd);
                this.selectionEnd = s+1; 
            }
        }
    }
  }

  function setGlobalsFromFieldValues(){
        let editorContentText = editorContent.val().replace(/\n/g,'')
        window.data = eval(editorContentText)
        window.title = document.title = editorTitle.val()
        window.author = editorAuthor.val()
        window.authorLink = editorAuthorLink.val()
        window.theme = editorThemeDark.checked ? "dark" : "light"
  }

  function downloadConfiguration() {
        setGlobalsFromFieldValues()
        var anchor =document.createElement('a');
        anchor.setAttribute('download', CONTENT_FILE);
        document.body.appendChild(anchor);

        const configurationString = `
          window.title= ${JSON.stringify(window.title)};
          window.data= ${JSON.stringify(window.data)};
          window.author=  ${JSON.stringify(window.author)};
          window.authorLink= ${JSON.stringify(window.authorLink)};
          window.theme=${JSON.stringify(window.theme)}`
        anchor.href = makeTextFile(configurationString);

        window.requestAnimationFrame(function () {
          var event = new MouseEvent('click');
          anchor.dispatchEvent(event);
          document.body.removeChild(anchor);
        });

      }

  $("#edit-button svg").click(() => {
    const scrollPos = $(this).scrollTop()

    $("#main").toggle()
    $("#main").empty();
    $("#edit-page").toggle()
    $("footer").hide()
    $('#edit-button').toggleClass('active')

    const formattedText = prettier.format(JSON.stringify(window.data), {
        parser: "babel",
        plugins: prettierPlugins,
    })

    if(!state.edit){
      state.lastScrollPos = scrollPos
      editorTitle.val(window.title)
      editorContent.val(formattedText)
      editorAuthor.val(window.author)
      editorAuthorLink.val(window.authorLink)
      const dark = window.theme == DARK_MODE
      editorThemeDark.checked = dark;
      editorThemeLight.checked = !dark;

      document.removeEventListener('keydown', checkKey, true);
      downloadLink.addEventListener('click', downloadConfiguration, false);
    }

    if(state.edit){
      downloadLink.removeEventListener('click', downloadConfiguration, false);

      setGlobalsFromFieldValues()

      render();

      $([document.documentElement, document.body]).animate({
            scrollTop: state.lastScrollPos
      }, 0);

    }

    state.edit = state.edit ? 0 : 1
  })

});
