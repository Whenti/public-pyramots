function gameplayScene(html2canvas, backendClient, menu) {
    this._cells = [];
    this._traces = [];
    this._matchData = {};
    this._gameturn = 0;
    this._answers = [];
    this._step = 0;
    this._height = 7;
    this._starting = 3;
    
    this._redobutton = null;
    
    //this.TIME = 60000;
    this.TIME = 30000;
    
    this._letters_html = [];
    this._all_letters = '';
    this._current_word = '';
    this._timer = 0;
    
    this._timer_html = '';
    this._timer_html_width = 300;
    
    this._points_html = '';
    this._points = 0;
    
    this.SPRITES = [];
    
    this.interval = '';
    
    this.start = function(i) {
        this.makeScene();
        this.setGame(i);
    }
    
    this.showPyramid = function(array){
        this.makeScene();
        this.populatePyramidWith(array);
        this.setBackMenu();
    }
    
    this.showAnsPyramid = function(i){
        this.makeScene();
        this.populatePyramidWithAns(i);
        this.setBackMenu();
    }
    
    this.populatePyramidWith = function(array){
        for(var j=0; j<array.length && j<this._height - this._starting + 1; ++j){
            for(var k=0; k<array[j].length; ++k){
                var cell = this._cells[j][k];
                cell.innerHTML = array[j][k];
                cell.style.backgroundImage='url(./img/bloc.png)';
                cell.style.backgroundSize='cover';
            }
        }
    }
    
    this.populatePyramidWithAns = function(i){
        backendClient.get_game(i)
        .then(function(json){
            console.log(json);
            var answers = json['msg'].split('#');
            answers[1] = answers[1].split(' ');
            for (var i = 0; i < answers[1].length; i++) {
                var splited = answers[1][i].split(";");
                answers[1][i] = (splited);
            }
            console.log(answers);
            return(answers);
        }).then(function(answers){
            var answer_sets = answers[1];
            var to_show_answers = [];
            for(var j = 0; j<answer_sets.length;++j){
                to_show_answers.push(answer_sets[j][0]);
            }
            
            this.populatePyramidWith(to_show_answers);
        }.bind(this));
    }
    
    this.setBackMenu = function(){
        var sceneRoot = document.getElementById('scene');
        sceneRoot.appendChild(document.createElement("br"));
        var buttonback = document.createElement('button');
        buttonback.innerHTML = 'Go back to menu';
        buttonback.className = "button";
        sceneRoot.appendChild(buttonback);
        
        buttonback.onclick = function(){
            menu.repopulate();
        }.bind(this);
    }
    
    this.setGame = function(i){
            backendClient.get_game(i)
            .then(function(json){
                console.log(json);
                var answers = json['msg'].split('#');
                answers[1] = answers[1].split(' ');
                for (var i = 0; i < answers[1].length; i++) {
                    var splited = answers[1][i].split(";");
                    answers[1][i] = (splited);
                }
                console.log(answers);
                return(answers);
            }).then(function(answers){
                this._all_letters = answers[0];
                this._answers = answers[1];
                
                this.initGame();
                this.startStep();
                this.startTimer();
            }.bind(this));
    }
    
    this.makePyramid = function(){
        var sceneRoot = document.getElementById('scene');
        
        //pyramid
        var table = document.createElement('par');
        table.className = "gametriangle";
        for (var j=this._starting; j<=this._height; j++){
            var rowEl = document.createElement('div');
            this._cells.push([]);
            for (var k=0; k<j; k++) {
                var cellEl = document.createElement('div');
                cellEl.className = "cell"
                rowEl.appendChild(cellEl);
                
                cellEl.style.backgroundImage='url(./img/dbloc.png)';
                cellEl.style.backgroundSize='cover';
                cellEl.innerHTML='&#8239;';
                
                this._cells[this._cells.length - 1].push(cellEl);
            }
            table.appendChild(rowEl);
        }
        sceneRoot.appendChild(table);
    }
    
    this.makeScene = function() {
        this.flush();
        
        var sceneRoot = document.getElementById('scene');
        
        var title = document.createElement('h1');
        title.innerHTML = "Pyramots";
        sceneRoot.appendChild(title);
        
        //timer
        this._timer_html = document.createElement('div');
        this._timer_html.className = "timer";
        sceneRoot.appendChild(this._timer_html);
        
        sceneRoot.appendChild(document.createElement("br"));
        sceneRoot.appendChild(document.createElement("br"));
        
        //points
        this._points_html = document.createElement('div');
        sceneRoot.appendChild(this._points_html);
        this._points_html.innerHTML = '';
        
        sceneRoot.appendChild(document.createElement("br"));
        
        this.makePyramid();
        
        sceneRoot.appendChild(document.createElement("br"));
    }
    
    this.initGame = function(){
        //letters + redo button
        this._letters_html = [];
        var sceneRoot = document.getElementById('scene');
        var table = document.createElement('table');
        table.className = "table";
        for (var j=0; j<2; j++){
            var rowEl = document.createElement('tr');
            for (var k=0; k<4; k++){
                if(j==1 && k==3){
                    this._redobutton = document.createElement('td');
                    var cell = this._redobutton;
                    cell.className = "letter";
                    cell.style.backgroundImage='url(./img/rletter.png)';
                    cell.style.backgroundSize='cover';
                    rowEl.appendChild(cell);
                }
                else{
                    var cell = document.createElement('td');
                    cell.className = "letter";
                    this._letters_html.push(cell);
                    cell.style.backgroundImage='url(./img/dletter.png)';
                    cell.style.backgroundSize='cover';
                    rowEl.appendChild(cell);
                }
            }
            table.appendChild(rowEl);
        }
        sceneRoot.appendChild(table);
        
        cell = this._points_html;
        cell.innerHTML = 0;
        cell.className='scoregame';
        cell.style.backgroundImage='url(./img/totaux.png)';
        cell.style.backgroundSize='cover';
        
        this._redobutton.onclick = function(event){
          this.startStep();  
        }.bind(this);
    }
    
    this.startTimer = function(){
        
        this._timer = this.TIME;
        var dt = 100;
        this._interval = setInterval(function(){
            this._timer-=dt;
            if(this._timer <= 0)
            {
                this.endGame();
                return;
            }
            var new_width = (this._timer/this.TIME) * this._timer_html_width;
            this._timer_html.style.width =  new_width + 'px';
        }.bind(this), dt);
    }
    
    this.endGame = function()
    {
        clearInterval(this._interval);
        console.log("end of the game");
        this.flush();
        menu.results(this._points, this._traces);
    }
    
    this.flush = function()
    {
        var sceneRoot = document.getElementById('scene');
        while (sceneRoot.firstChild) {
          sceneRoot.removeChild(sceneRoot.firstChild);
        }
    }
    
    this.startStep = function(){
        this._current_word = '';
        var cells = this._cells[this._step];
        for (var j=0; j<cells.length; ++j)
        {
            cells[j].innerHTML = '&#8239;';
            cells[j].style.backgroundImage='url(./img/dbloc.png)';
            cells[j].style.backgroundSize='cover';
        }
        var letters = this._all_letters.substr(0,this._starting + this._step);
        for (var j=0; j<letters.length; j++){
            var cell = this._letters_html[j]
            cell.innerHTML = letters[j];
            cell.style.backgroundImage='url(./img/letter.png)';
            cell.style.backgroundSize='cover';
            cell.onclick= function(event){
                        this.onCellClick(event);
                    }.bind(this);
        }
    }
    
    this.onCellClick = function (event){
        var sourceElmt = event.srcElement;
        var cell = sourceElmt;
        var new_letter = cell.innerHTML;
        cell.innerHTML = '';
        cell.onclick = null;
        cell.style.backgroundImage='url(./img/dletter.png)';
        cell.style.backgroundSize='cover';
        
        var pyrcell = this._cells[this._step][this._current_word.length];
        pyrcell.innerHTML = new_letter;
        
        pyrcell.style.backgroundImage='url(./img/bloc.png)';
        pyrcell.style.backgroundSize='cover';
        
        this._current_word += new_letter;
        
        if(this._answers[this._step][0].length == this._current_word.length)
        {
            //the word is large enough
            if(this._answers[this._step].includes(this._current_word)){
                //is good answer ?
                this._step += 1;
                this._traces.push(this._current_word);
                this.addPoints(this._current_word.length);
                if(this._step + this._starting > this._height)
                {
                    this.addPoints(this._timer/1000);
                    this.endGame();
                    return;
                }
                this.startStep();
            }
            else
            {
                //otherwise start again
                this.startStep();
            }
        }
    }
    
    this.addPoints = function(dpoints)
    {
        this._points += dpoints;
        this._points_html.innerHTML = this._points;
    }
    
}
