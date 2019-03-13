function menuScene(FBInstant, backendClient, html2canvas) {
    this._matchData = {};
    this._game = null;
    this._totaux_cells = [];
    this._totaux = [];
    
    this._scorecells = [[],[]];
    this._pyramidcells = [];
    this._answercells = [];
    
    this._photos = [];
    this._names = [];
    
    this.start = function() {
        console.log("menu start");
        this._game = null;
        this.makeGrid();
        console.log("grid made");
        var contextId = FBInstant.context.getID();
        FBInstant.player.getSignedPlayerInfoAsync(contextId)
        .then(function(signedPlayerInfo){
            console.log(signedPlayerInfo.getSignature());
            return backendClient.load(signedPlayerInfo.getSignature());
        })
        .then(function(result){
            if (result.empty) {
                console.log(result);
                console.log("empty...");
                return this.createNewGameAsync();
            } else {
                console.log("not empty");
                return Promise.resolve(result.data);
            }
        }.bind(this))
        .then(function(backendData){
            this.populateFromBackend(backendData,false);
        }.bind(this))
        .catch(function(error){
            this.displayError(error);
        }.bind(this));
    }
    
    this.startNewContext = function(){
        selectContext();
    }
    
    this.repopulate = function() {
        this._game = null;
        this.makeGrid();
        this.populateFromBackend(this._matchData,true);
    }
    
    this.flush = function() {
        var sceneRoot = document.getElementById('scene');
        while (sceneRoot.firstChild) {
          sceneRoot.removeChild(sceneRoot.firstChild);
        }  
    };
    
    this.makeGrid = function() {
        this.flush();
        var sceneRoot = document.getElementById('scene');
        
        var title = document.createElement('h1');
        title.innerHTML = "Pyramots";
        sceneRoot.appendChild(title);
        
        var joueurs = document.createElement('table');
        joueurs.className = "table";
        
        //photos
        var photos = document.createElement('tr');
        this._photos = [];
        
        var photo1 = document.createElement('td');
        this._photos.push(document.createElement('img'));
        photo1.appendChild(this._photos[0]);
        
        var photo2 = document.createElement('td');
        this._photos.push(document.createElement('img'));
        photo2.appendChild(this._photos[1]);
        
        photos.appendChild(photo1);
        photos.appendChild(photo2);
        joueurs.appendChild(photos);
        
        var names = document.createElement('tr');
        
        this._names = [document.createElement('td'), document.createElement('td')];
        
        for(var j=0; j<this._names.length;++j){
            names.appendChild(this._names[j]);
            this._names[j].className = "name";
        }
        
        joueurs.appendChild(names);
        
        
        //total points
        var totaux = document.createElement('tr');
        
        this._totaux_cells = [];
        for (var j=0; j<2; j++){
            var totalpoint = document.createElement('td');
            totalpoint.className = "totalpoints";
            totaux.appendChild(totalpoint);
            this._totaux_cells.push(totalpoint);
        }
        joueurs.appendChild(totaux);
        
        sceneRoot.appendChild(joueurs);
        
        sceneRoot.appendChild(document.createElement("br"));
        
        var table = document.createElement('table');
        table.className = "table";
        
        //scores
        this._scorecells = [];
        this._pyramidcells = [];
        this._answercells = [];
        
        for (var j = 0; j<3; j++){ //3 rows
            var rowEl = document.createElement('tr');
            
            var nscore = [document.createElement('td'),document.createElement('td')];
            var npy = [document.createElement('td'),document.createElement('td')];
            var nans = document.createElement('td');
            
            this._scorecells.push(nscore);
            this._pyramidcells.push(npy);
            this._answercells.push(nans);
            
            for(var k=0; k<nscore.length ;k++){
                cell = nscore[k];
                cell.className = "scorecell empty";
                cell.innerHTML = '';
                cell.style.backgroundImage='url(./img/npapyrus'+k+'.png)';
                cell.style.backgroundSize='cover';
            }
            for(var k=0; k<npy.length ;k++){
                cell = npy[k];
                cell.className = "pyramid";
                cell.onclick = null;
                cell._column = k;
                cell._row = j;
            }
            
            nans.className = "pyramid";
            nans.onclick = null;
            nans._row = j;
            
            var to_add = [npy[0],nscore[0],nans,nscore[1],npy[1]];
            for(var k=0; k<to_add.length ;k++){
                cell = to_add[k];
                rowEl.appendChild(cell);
            }
            
            table.appendChild(rowEl);
        }
        
        sceneRoot.appendChild(table);
        
        sceneRoot.appendChild(document.createElement("br"));
        
        
    }
    
    this.populateFromBackend = function(matchData, json) {
        console.log(matchData);
        var sceneRoot = document.getElementById('scene');
        
        if(!json){
            this._matchData = JSON.parse(matchData);
        }
        else{
            this._matchData = matchData;
        }
        
        var playerId = FBInstant.player.getID();
        if (this._matchData.players.length == 1 && this._matchData.players[0] !== playerId) {
            // This player just accepted a challenge.
            // We need to persist their ID as the second player
            this._matchData.players.push(playerId);
            //FBInstant.player.getPhoto()
            this._matchData.photos.push("");
            this._matchData.names.push(FBInstant.player.getName());
        }
        
        //photos + names
        for(var j=0; j<this._matchData.photos.length; ++j){
            this._photos[j].src = this._matchData.photos[j];
        }
        for(var j=0; j<this._matchData.names.length; ++j){
            this._names[j].innerHTML = this._matchData.names[j];
        }
        
        //put scores
        var current_cells = this._matchData.cells;
        var current_traces = this._matchData.traces;
        
        this._totaux = [0,0]
        
        //scores + pyramids
        for (var j=0; j< current_cells.length; ++j){
            for(var k=0; k< current_cells[j].length; ++k){
                var score = current_cells[j][k];
                this._totaux[j]+=score;
                
                //score cell
                var cell = this._scorecells[k][j];
                cell.style.backgroundImage='url(./img/papyrus'+j+'.png)';
                cell.style.backgroundSize='cover';
                cell.innerHTML = score;
                
                //pyramid cells
                cell = this._pyramidcells[k][j];
                cell.onclick = function(event){
                    this.onPyramidClick(event);
                }.bind(this)
                
                cell.style.backgroundImage='url(./img/pyramid.png)';
                cell.style.backgroundSize='cover';
            }
            var cell = this._totaux_cells[j]
            cell.innerHTML = this._totaux[j];
            cell.style.backgroundImage='url(./img/totaux.png)';
            cell.style.backgroundSize='cover';
        }
        //answers
        for (var k=0; k<Math.min(current_cells[0].length, current_cells[1].length); k++)
        {
            var cell = this._answercells[k];
            cell.onclick = function(event){
                    this.onPyramidAnsClick(event);
                }.bind(this)
            cell.style.backgroundImage='url(./img/pyramidans.png)';
            cell.style.backgroundSize='cover';
        }
        
        var playerIndex = this.getPlayerIndex();
        
        if(current_cells[0].length==3 && current_cells[1].length==3)
        {
            var message = document.createElement('h2');
            if(this._totaux[playerIndex] > this._totaux[playerIndex^1]){
                message.innerHTML = "Vous avez gagné !";
            }
            else if(this._totaux[playerIndex] < this._totaux[playerIndex^1]){
                message.innerHTML = "Vous avez perdu...";
            }
            else{
                message.innerHTML = "Égalité !";
            }
            sceneRoot.appendChild(message);
            
            
            if (!this.isPlayerTurn()){   
                var attente = document.createElement('h2');
                attente.innerHTML = "En attente de l'autre joueur...";
                sceneRoot.appendChild(attente);
            }
            else{
                var button = document.createElement('button');
                button.innerHTML = 'Recommencer';
                button.className = "button";
            
                button.onclick = function(event){
                    this.restartGame();
                }.bind(this);
                
                sceneRoot.appendChild(button);   
            }
            
            sceneRoot.appendChild(document.createElement("br"));
            
            var autres = document.createElement('button');
            autres.innerHTML = 'Jouer avec d\'autres amis !';
            autres.className = "button";
            autres.onclick = function(event){
                this.startNewContext();
            }.bind(this);
            sceneRoot.appendChild(autres);
        }
        else if (!this.isPlayerTurn()){
            var attente = document.createElement('h2');
            attente.innerHTML = "C'est au tour de l'autre joueur, attendez le votre.";
            sceneRoot.appendChild(attente);
            
            var button = document.createElement('button');
            button.innerHTML = 'Jouer avec d\'autres amis !';
            button.className = "button";
            button.onclick = function(event){
                this.startNewContext();
            }.bind(this);
            sceneRoot.appendChild(button);
        }
        else{
            //button
            var button = document.createElement('button');
            button.innerHTML = 'Jouer cette manche';
            button.className = "button";
            button.onclick = function(event){
                var playerIndex = this.getPlayerIndex()
                var i = this._matchData.gamevalues[this._matchData.cells[playerIndex].length]
                this.launchGame(i);  
            }.bind(this);
            
            sceneRoot.appendChild(button);
        }
    }
    
    this.restartGame = function(){
        this.makeGrid();
        this._matchData.cells = [[],[]];
        this._matchData.traces = [[],[]];
        this._matchData.gamevalues = [Math.floor(Math.random()*7000), Math.floor(Math.random()*7000), Math.floor(Math.random()*7000)];
        this.populateFromBackend(this._matchData, true);
    }
    
    this.launchGame = function(i) {
        this.flush();
        this._game = new gameplayScene(html2canvas, backendClient, this);
        this._game.start(i);
    };
    
    this.isPlayerTurn = function(){
        var playerIndex = this.getPlayerIndex();
        return (playerIndex == this._matchData.playerTurn);
    }
    
    this.createNewGameAsync = function() {
        var game_values = [Math.floor(Math.random()*7000), Math.floor(Math.random()*7000), Math.floor(Math.random()*7000)];
        var playerId = FBInstant.player.getID();
        //var playerPhoto = FBInstant.player.getPhoto();
        var playerPhoto = "";
        var playerName = FBInstant.player.getName();
        this._matchData = {
            'cells': [[],[]],
            'playerTurn': 0,
            'traces' : [[],[]],
            'players': [playerId],
            'gamevalues' : game_values,
            'photos' : [playerPhoto],
            'names': [playerName]
            };
        
        return new Promise(function(resolve, reject)
        {
            this.saveDataAsync()
            .then((savedData) => resolve(JSON.stringify(savedData)))
            .catch(reject);
        }.bind(this))
    }
    
    this.saveDataAsync = function() {
        var matchData = this._matchData;
        return new Promise(function(resolve, reject){
            console.log('going to save', JSON.stringify(matchData));
            FBInstant.player
            .getSignedPlayerInfoAsync(JSON.stringify(matchData))
            .then(function(result){
                return backendClient.save(
                    FBInstant.context.getID(),
                    result.getPlayerID(),
                    result.getSignature()
                )
            })
            .then(function(){
                console.log(matchData);
                resolve(matchData);
            })
            .catch(function(error){
                console.log(error);
                reject(error);
            })
        });
    }
    
    this.displayError = function(error) {
        console.log('Error loading from backend', error);
    }
    
    this.getPlayerIndex = function(){
        var playerId = FBInstant.player.getID();
        var playerIndex = this._matchData.players.indexOf(playerId);
        return playerIndex;
    }
    
    this.results = function(score, trace) {
        var playerIndex = this.getPlayerIndex();
        
        this._matchData.playerTurn ^= 1;
        
        this._matchData.cells[playerIndex].push(score);
        this._matchData.traces[playerIndex].push(trace);
        this._game = null;
        
        console.log(this._matchData)
        
        this.saveDataAsync()
        .then(function(){
            this.repopulate();
        }.bind(this))
        .then(function(){
            return this.getPlayerImageAsync()
        }.bind(this))
        .then(function(image){
            var updateConfig = this.getUpdateConfig(image)
            return FBInstant.updateAsync(updateConfig)
        }.bind(this))
    }
    
    this.getUpdateConfig = function(base64Picture) {
        var updateData = null;
        var playerName = FBInstant.player.getName();
        
        var cells = this._matchData.cells;
        if(cells[0].length == 1 && cells[1] == 0){
            updateData =
            {
                action: 'CUSTOM',
                cta: 'Play!' ,
                image: base64Picture,
                text: {
                    default: playerName + ' started a new game.',
                    localizations: {
                        fr_FR: playerName + ' a commencé une nouvelle partie.',
                    }
                },
                template: 'game_started',
                data: { rematchButton:false},
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH',
            }; 
        }
        else if(cells[0].length == 3 && cells[1].length == 3){
            updateData =
            {
                action: 'CUSTOM',
                cta: 'Play!' ,
                image: base64Picture,
                text: {
                    default: 'The game is over, look who won!',
                    localizations: {
                        fr_FR: 'La partie est terminée, regardez qui a gagné !',
                    }
                },
                template: 'end_match',
                data: { rematchButton:true},
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH',
            }; 
        }
        else {
            updateData =
            {
                action: 'CUSTOM',
                cta: 'Play!' ,
                image: base64Picture,
                text: {
                    default: playerName + ' has played, it is your turn!',
                    localizations: {
                        fr_FR: playerName + ' a joué, c\'est à votre tour !',
                    }
                },
                template: 'play_turn',
                data: { rematchButton:false},
                strategy: 'IMMEDIATE',
                notification: 'NO_PUSH',
            };
        }
        return updateData;
        
    }
    
    this.getPlayerImageAsync = function() {
        return new Promise(function(resolve, reject){
            var sceneRoot = document.getElementById('scene');
            var sceneWidth = sceneRoot.offsetWidth;
            html2canvas(sceneRoot, {width:sceneWidth*3, x:-(sceneWidth)})
                .then(function(canvas){
                    resolve(canvas.toDataURL("image/png"));
                })
                .catch(function(err){
                    reject(err);
                })
        })

    }
    
    this.onPyramidClick = function(event) {
        var sourceElmt = event.srcElement;
        var cell = null;
        if (sourceElmt.tagName === 'IMG') {
            cell = sourceElmt.parentNode;
        } else {
            cell = sourceElmt;
        }
        
        this.flush();
        this._game = new gameplayScene(html2canvas, backendClient, this);
        this._game.showPyramid(this._matchData.traces[cell._column][cell._row]);
    }
    this.onPyramidAnsClick = function(event) {
        var sourceElmt = event.srcElement;
        var cell = null;
        if (sourceElmt.tagName === 'IMG') {
            cell = sourceElmt.parentNode;
        } else {
            cell = sourceElmt;
        }
        this.flush();
        this._game = new gameplayScene(html2canvas, backendClient, this);
        this._game.showAnsPyramid(this._matchData.gamevalues[cell._row]);     
    }
}
