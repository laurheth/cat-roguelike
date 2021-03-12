import { Display, EventManager, Random } from 'roguelike-pumpkin-patch';
import FOV from './FOV';
import {default as Tile, RememberTile } from './Tile';
import Player from './Player';
import MapGenerator from './MapGenerator';
import Foe from './Foe';

export interface StatusNumber {
    min:number;
    max:number;
    class?:string;
}

/** Container for the entire game */
export default class Game {
    // Display related things
    displayDiv:HTMLElement;
    displayWidth:number;
    displayHeight:number;
    center:number[];
    display:Display;
    // The random number generator
    random:Random;
    // Container for the map
    map:{startTile:Tile,allTiles:Tile[]};
    // Event manager
    event:EventManager;
    loop:boolean;
    actors:Foe[];
    // Status updates
    fearElement:HTMLElement;
    hungerElement:HTMLElement;
    sharpnessElement:HTMLElement;
    // Inventory element
    itemElement:HTMLElement;
    actionsElement:HTMLElement;
    // Messages element
    messagesElement:HTMLElement;
    messages:HTMLElement[]=[];
    nextMessage:HTMLElement|null=null;
    /** Constructor, start the game! */
    constructor() {
        // Grab every elements we're going to need
        const displayDiv:HTMLElement|null = document.getElementById("display");
        const fearElement:HTMLElement|null = document.getElementById("fear");
        const hungerElement:HTMLElement|null = document.getElementById("hunger");
        const sharpnessElement:HTMLElement|null = document.getElementById("sharpness");
        const itemElement:HTMLElement|null = document.getElementById("item");
        const actionsElement:HTMLElement|null = document.getElementById("specialActions");
        const messagesElement:HTMLElement|null = document.getElementById("messages");
        
        if (displayDiv && fearElement && hungerElement && sharpnessElement && messagesElement && itemElement && actionsElement) {
            this.displayDiv = displayDiv;
            this.fearElement = fearElement;
            this.hungerElement = hungerElement;
            this.sharpnessElement = sharpnessElement;
            this.messagesElement = messagesElement;
            this.itemElement = itemElement;
            this.actionsElement = actionsElement;
        } else {
            throw new Error("Unable to get all elements on the page.");
        }

        this.displayWidth=15;
        this.displayHeight=15;
        this.display = new Display({target:displayDiv, width: this.displayWidth, height: this.displayHeight});
        this.center = [Math.floor(this.displayWidth/2),Math.floor(this.displayHeight/2)];
        let tileSize = this.display.calculateTileSize();
        this.display.tileSize = {
            tileHeight: Math.ceil(tileSize.tileHeight),
            tileWidth: Math.ceil(tileSize.tileWidth),
        }

        window.addEventListener("resize",()=>{
            tileSize = this.display.calculateTileSize();
            this.display.tileSize = {
                tileHeight: Math.ceil(tileSize.tileHeight),
                tileWidth: Math.ceil(tileSize.tileWidth),
            }
        });

        this.random = new Random();
        this.map = MapGenerator(1,this.random);
        const tile = this.map.startTile;
        this.loop=false;
        this.actors = [];

        const fov = new FOV(
            (tile:Tile) => {
                return tile.seeThrough;
            },
            ([x,y],tile:Tile) => {
                this.display.setTile(this.center[0]+x, this.center[1]+y, tile.getTile());
            },
            (tile:Tile) => {

                this.map.allTiles.forEach(tile=>tile.remembered=0);

                const toDisplay:any[][] = [];
                for(let i=0;i<this.displayWidth;i++) {
                    const row:any = []
                    for(let j=0;j<this.displayHeight;j++) {
                        row.push(-1);
                    }
                    toDisplay.push(row);
                }
                let distance = 0;
                let rememberList:RememberTile[] = [
                    {
                        position:[this.center[0],this.center[1]],
                        tile:tile
                    }
                ];
                while(distance < 50) {
                    const nextRememberList:RememberTile[] = []
                    rememberList.forEach(x=>{
                        x.tile.remember(x.position,toDisplay,distance).forEach(y=>{
                            nextRememberList.push(y);
                        });
                    });
                    rememberList = nextRememberList;
                    distance++;
                }

                for(let i=0;i<this.displayWidth;i++) {
                    for(let j=0;j<this.displayHeight;j++) {
                        this.display.setTile(i,j,toDisplay[j][i]);
                    }
                }
            },6
        );

        this.event = new EventManager({type:'simple'});

        this.clearMessages();
        this.buildMessage("Welcome to the Furball Catacombs! You are a cat, and your human doesn't know how to hunt. There is only one solution: enter the cat dimension, find the Mouse of Yendor, defeat it, and leave it in your human's shoe. Space is weird here, but you've come here many times for naps; you can handle it! Keep your claws sharp, your belly full, and don't get too scared. Good luck!","good");
        this.sendMessage();

        if(tile) {
            const player = new Player({
                startTile:tile,
                fov: fov,
                statusUpdate:this.updateStatus,
                rng:this.random,
                game:this,
            });
            const foe = new Foe({
                type:'mouse',
                startTile: this.random.getRandomElement(this.map.allTiles.filter(x=>x.passable)),
                rng:this.random,
                event:this.event,
                game:this,
            })
            this.actors.push(foe);
            this.event.add(player);
            this.start();
        } else {
            // Update this to figure out an alternative (i.e. maybe try again?)
            throw new Error("No initial tile found.");
        }
    }

    /** Start the event manager */
    async start() {
        this.loop=true;
        while(this.loop) {
            await this.event.advance();
        }
    }

    /** Stop the events */
    stop() {
        this.loop=false;
    }

    /** Clear events of all foes (leave the player, though) */
    clearEvent() {
        this.actors.forEach(actor=>this.event.remove(actor));
    }

    /** Update the status display */
    updateStatus = (fear:StatusNumber, hunger:StatusNumber, sharpness:StatusNumber, item="Nothing.")=> {
        this.fearElement.innerText = `${fear.min}/${fear.max}`;
        this.hungerElement.innerText = `${hunger.min}/${hunger.max}`;
        this.sharpnessElement.innerText = `${sharpness.min}/${sharpness.max}`;

        this.fearElement.className = (fear.class) ? fear.class : "";
        this.hungerElement.className = (hunger.class) ? hunger.class : "";
        this.sharpnessElement.className = (sharpness.class) ? sharpness.class : "";

        this.itemElement.innerText = item;
    }

    /** Update the special actions list */
    specialActions = (actions:{name:string,callback:()=>void}[]) => {
        while(this.actionsElement.lastChild) {
            this.actionsElement.removeChild(this.actionsElement.lastChild);
        }
        if(actions.length < 1) {
            const li = document.createElement('li');
            li.innerText = "None available."
            this.actionsElement.appendChild(li);
        } else {
            actions.forEach(action=>{
                const li = document.createElement('li');
                const button = document.createElement('button');
                button.innerText = action.name;
                button.addEventListener("click",(e)=>{
                    e.preventDefault();
                    action.callback();
                });
                li.appendChild(button);
                this.actionsElement.appendChild(li);
            });
        }
    }

    /** Clear messages */
    clearMessages() {
        while(this.messages.length>0) {
            this.messages.pop();
        }
        while(this.messagesElement.lastChild) {
            this.messagesElement.removeChild(this.messagesElement.lastChild);
        }
    }

    /** Build the next message that will be sent. */
    buildMessage(message:string, className:string="") {
        if (!this.nextMessage) {
            this.nextMessage = document.createElement('li');
        }
        const thisPart = document.createElement('span');
        thisPart.innerHTML = message+" ";
        thisPart.className = className;
        this.nextMessage.appendChild(thisPart);
    }

    /** Generate a reset button and slip it in with the messages */
    resetButton() {
        const button = document.createElement('button');
        button.innerText = "Try again?";
        if (this.nextMessage) {
            console.log("wtf");
            this.nextMessage.appendChild(button);
        }
    }

    /** Send the new message */
    sendMessage() {
        if(this.nextMessage) {
            this.messages.unshift(this.nextMessage);
            this.messagesElement.prepend(this.nextMessage);
            this.nextMessage = null;
            if(this.messages.length > 10) {
                this.messages.pop();
                if(this.messagesElement.lastChild) {
                    this.messagesElement.removeChild(this.messagesElement.lastChild);
                }
            }
        }
    }
}