import Tile from './Tile';
import { default as Critter, CritterParams } from './Critter';
import Foe from './Foe';
import FOV from './FOV';
import Game, { StatusNumber } from './Game';
import { Random } from 'roguelike-pumpkin-patch';
import Item from './Item';

interface PlayerParams  {
    fov:FOV;
    startTile:Tile;
    statusUpdate:(fear:StatusNumber,hunger:StatusNumber,sharpness:StatusNumber,item:string|undefined)=>void;
    rng:Random;
    game:Game;
}

/** The player */
export default class Player extends Critter {
    readonly fov:FOV;
    private fear:number;
    private hunger:number;
    private sharpness:number;
    private maxFear:number;
    private maxHunger:number;
    private maxSharpness:number;
    private statusUpdate:(fear:StatusNumber,hunger:StatusNumber,sharpness:StatusNumber,item:string|undefined)=>void;
    private rng:Random;
    private game:Game;
    private xp:number;
    private turnCount:number;
    private item:Item|null;
    private actions:{name:string,callback:()=>void,button:string[]}[]
    constructor(params:PlayerParams) {
        const { fov, startTile, statusUpdate, rng, game, ...rest } = params;
        super({
            startTile:startTile,
            appearance:{
                content:'<img src="./assets/cat.png" alt="A very good cat.">',
                classList:['player']
            }
        });

        this.item=null;
        this.fov = fov;
        this.statusUpdate = statusUpdate;
        this.rng = rng;
        this.game = game;
        this.fear = 0;
        this.hunger = 0;
        this.sharpness = 5;
        this.maxFear = 10;
        this.maxHunger = 10;
        this.maxSharpness = 10;
        this.xp = 0;
        this.turnCount=0;
        this.actions=[];
    }

    /** Reset stats */
    resetStats() {
        this.alive=true;
        this.fear = 0;
        this.hunger = 0;
        this.sharpness = 5;
        this.maxFear = 10;
        this.maxHunger = 10;
        this.maxSharpness = 10;
        this.xp = 0;
        this.turnCount = 0;
        this.item=null;
    }

    /** Gain XP */
    gainXP(xp:number) {
        let possibleGains = false;
        if (xp > 0) {
            for(let i=0;i<xp;i++) {
                if (this.xp % 10 !== 0) {
                    possibleGains = true;
                } else {
                    possibleGains = false;
                }
                this.xp++;
                this.fear = Math.max(0, this.fear - 1);
                if (this.xp % 10 === 0 && possibleGains) {
                    this.maxFear++;
                    this.maxSharpness++;
                    this.sharpness++;
                }
            }
        }
    }

    /** Act */
    act() {
        // Update view
        this.fov.look(this.currentTile);
        // Update status
        this.updateStatus();
        this.turnCount++;
        this.honger();
        // Prepare for player input
        if (this.alive) {
            return new Promise(resolve => {
                const eventHandler = (event:KeyboardEvent)=>{
                    const eventResult = this.handleEvent(event);
                    if(eventResult) {
                        document.removeEventListener('keydown',eventHandler);
                        if (eventResult instanceof Foe) {
                            this.game.buildMessage(`You claw the ${eventResult.type}!`);
                            this.gainXP(eventResult.attackMe(this.calcDmg()));
                            this.dullClaws();
                        }
                        resolve(true);
                    }
                }
                document.addEventListener('keydown',eventHandler);
                // Update available special actions
                while(this.actions.length > 0) {
                    this.actions.pop();
                }
                // Are we on a staircase?
                if(this.currentTile.isStair()) {
                    this.game.buildMessage("You found the stairs down!","good");
                    this.actions.push({
                        name:"Go down the stairs",
                        callback:()=>{
                            this.game.buildMessage(`You go down the stairs to level ${this.game.level+1}...`)
                            this.game.newLevel(this.game.level+1,this.game.map,this);
                        },
                        button:['>','<','Enter']
                    })
                }
                // Is there an item to pick up?
                if(this.currentTile.item) {
                    this.game.buildMessage(`You see here a ${this.currentTile.item.name}.`);
                    this.actions.push({
                        name:"Pick up "+this.currentTile.item.name,
                        callback:()=>{
                            const currentItem = this.item;
                            this.item = this.currentTile.item;
                            if (this.item) {
                                if(currentItem) {
                                    this.currentTile.item = currentItem;
                                } else {
                                    this.currentTile.item = null;
                                }
                                this.game.buildMessage("You pick up the "+this.item.name+".");
                                document.removeEventListener('keydown',eventHandler);
                                resolve(true);
                            }
                        },
                        button:["g","p","Enter"]
                    })
                }
                const item=this.item;
                if(item) {
                    // Is the held item usable?
                    if(item.usable) {
                        this.actions.push({
                            name:item.useVerb+" "+item.name,
                            callback:()=>{
                                this.game.buildMessage(`You ${item.useVerb.toLowerCase()} the ${item.name}.`);
                                this.item = item.use(this);
                                document.removeEventListener('keydown',eventHandler);
                                resolve(true);
                            },
                            button:["u","e","Enter"]
                        });
                    }
                    // Drop the item?
                    this.actions.push({
                        name:"Drop "+item.name,
                        callback:()=>{
                            const tile = this.currentTile.findEmptyNeigbour(x=>!x.item);
                            if (tile) {
                                tile.item = this.item;
                                this.item = null;
                                this.game.buildMessage("You drop the "+item.name+".");
                                document.removeEventListener('keydown',eventHandler);
                                resolve(true);
                            }
                        },
                        button:["d","p","Delete"]
                    });
                }
                // Send whatever messages have been built over the last turn
                this.game.sendMessage();
                this.game.specialActions(this.actions);
            });
        } else {
            return;
        }
    }

    /** Advance honger */
    honger() {
        if(this.turnCount % 50 === 0) {
            this.hunger++;
            if (this.hunger === this.maxHunger-1) {
                this.game.buildMessage("You are starving!","bad");
            }
        }
        if (this.hunger >= this.maxHunger) {
            this.game.buildMessage("You are too hungry! You flee to find your food bowl back home.","bad");
            this.die();
        }
    }

    /** Update status */
    updateStatus() {
        this.statusUpdate({
            min:this.fear,
            max:this.maxFear,
            class:(this.fear / this.maxFear > 0.8) ? "panic" : ""
        },{
            min:Math.max(0,this.hunger),
            max:this.maxHunger,
            class:(this.hunger / this.maxHunger > 0.8) ? "panic" : ""
        },{
            min:this.sharpness,
            max:this.maxSharpness,
            class:(this.sharpness / this.maxSharpness > 0.8) ? "party" : ""
        },this.item?.name);
    }

    /** Calculate damage */
    calcDmg() {
        const min = Math.min(1,this.sharpness / 2);
        const max = Math.max(2, 1.5 * this.sharpness);
        return this.rng.getNumber(min,max);
    }

    dullClaws() {
        if (this.sharpness > this.maxSharpness) {
            this.sharpness--;
        } else if (this.sharpness > 1) {
            for(let i=(this.maxSharpness - this.sharpness); i<this.maxSharpness;i++) {
                if(this.rng.getRandom() > 0.96) {
                    this.sharpness--;
                    break;
                }
            }
        }
    }

    attackMe(damage:number) {
        this.fear += damage;
        if (this.fear >= this.maxFear) {
            this.game.buildMessage("You panic, and run for your life!","bad");
            this.die();
        } else if (this.maxFear - this.fear < damage*1.5) {
            this.game.buildMessage("You are getting very scared!","bad");
        }
        return 0;
    }

    feed(feed:number) {
        this.hunger = this.hunger - feed;
        this.game.buildMessage("Delicious!","good");
        if (this.hunger < 0) {
            this.hunger = -1;
        }
    }

    public die() {
        this.alive=false;
        while(this.actions.length > 0) {
            this.actions.pop();
        }
        this.game.specialActions(this.actions);
        this.game.resetButton();
        this.game.sendMessage();
        this.fov.look(this.currentTile);
        this.updateStatus();
        this.game.stop();
    }

    /** Event handler */
    handleEvent(event:KeyboardEvent) {
        let acted:boolean|Critter = false;
        switch(event.key) {
            case 'Right':
            case '6':
            case 'ArrowRight':
                acted = this.step(1,0);
                break;
            case 'Left':
            case 'ArrowLeft':
            case '4':
                acted = this.step(-1,0);
                break;
            case 'Up':
            case 'ArrowUp':
            case '8':
                acted = this.step(0,-1);
                break;
            case 'Down':
            case 'ArrowDown':
            case '2':
                acted = this.step(0,1);
                break;
            case 'Period':
            case '.':
            case '5':
                acted=true;
                break;
            default:
                if(this.actions.length>0) {
                    const action = this.actions.find(x=>x.button.includes(event.key));
                    if (action) {
                        action.callback();
                        acted=true;
                    }
                }
                break;
        }
        return acted;
    }
}