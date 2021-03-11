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
    // Messages element
    messagesElement:HTMLElement;
    messages:string[]=[];
    /** Constructor, start the game! */
    constructor() {
        // Grab every elements we're going to need
        const displayDiv:HTMLElement|null = document.getElementById("display");
        const fearElement:HTMLElement|null = document.getElementById("fear");
        const hungerElement:HTMLElement|null = document.getElementById("hunger");
        const sharpnessElement:HTMLElement|null = document.getElementById("sharpness");
        const itemElement:HTMLElement|null = document.getElementById("item");
        const messagesElement:HTMLElement|null = document.getElementById("messages");
        
        if (displayDiv && fearElement && hungerElement && sharpnessElement && messagesElement && itemElement) {
            this.displayDiv = displayDiv;
            this.fearElement = fearElement;
            this.hungerElement = hungerElement;
            this.sharpnessElement = sharpnessElement;
            this.messagesElement = messagesElement;
            this.itemElement = itemElement;
        } else {
            throw new Error("Unable to get all elements on the page.");
        }

        this.displayWidth=15;
        this.displayHeight=15;
        this.display = new Display({target:displayDiv, width: this.displayWidth, height: this.displayHeight});
        this.center = [Math.floor(this.displayWidth/2),Math.floor(this.displayHeight/2)];
        this.display.tileSize = this.display.calculateTileSize();
        window.addEventListener("resize",()=>this.display.tileSize = this.display.calculateTileSize());

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
        this.sendMessage("Welcome to the Furball Catacombs! You are a cat, and your owner doesn't know how to hunt. There is only one solution: enter the cat dimension, find the Mouse of Yendor, defeat it, and leave it in your owner's shoe. Space is weird here, but you've come here many times for naps; you can handle it! Keep your claws sharp, your belly full, and don't get too scared. Good luck!");

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

    /** Clear messages */
    clearMessages() {
        while(this.messages.length>0) {
            this.messages.pop();
        }
        while(this.messagesElement.lastChild) {
            this.messagesElement.removeChild(this.messagesElement.lastChild);
        }
    }

    /** Send a message */
    sendMessage(message:string,className="") {
        this.messages.unshift(message);
        const newMessageElement = document.createElement("li");
        newMessageElement.innerHTML = message;
        newMessageElement.className = className;
        this.messagesElement.prepend(newMessageElement);
        if(this.messages.length > 10) {
            this.messages.pop();
            if(this.messagesElement.lastChild) {
                this.messagesElement.removeChild(this.messagesElement.lastChild);
            }
        }
    }
}