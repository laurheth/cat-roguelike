import Critter from './Critter';
import Player from './Player';
import Game from './Game';
import Tile from './Tile';
import { Random } from 'roguelike-pumpkin-patch';

type CritterBuilder = (type:string, tile:Tile,rng?:Random)=>Critter;

const BuildSpecial:CritterBuilder = (type:string, tile:Tile, rng?:Random)=>{
    let postArt = 'scratchingPostBetter.png';
    if(type === "bowl") {
        let name="food bowl";
        postArt="foodBowl.png";
        // Scratching post
        const critter = new Critter({
            startTile:tile,
            appearance:{
                content:`<img src="./assets/${postArt}" alt="Food bowl.">`,
                classList:[]
            },
            onInteract:(player:Player,game:Game)=>{
                game.buildMessage(`You eat from your ${name}.`);
                if (rng) {
                    player.feed(rng.getNumber(1,3));
                } else {
                    player.feed(2);
                }
                critter.die();
            }
        });
        return critter;
    } else {
        let name="scratching post"
        if(type==="table") {
            name="table";
            postArt="table.png";
        } else if (type==="chair") {
            name="chair";
            postArt="chair.png";
        }
        // Scratching post
        const critter = new Critter({
            startTile:tile,
            appearance:{
                content:`<img src="./assets/${postArt}" alt="Scratching post.">`,
                classList:[]
            },
            onInteract:(player:Player,game:Game)=>{
                game.buildMessage(`You sharpen your claws on the ${name}!`);
                if (rng) {
                    player.sharpenClaws(rng.getNumber(1,3));
                } else {
                    player.sharpenClaws(1);
                }
                critter.die();
            }
        });
        return critter;
    }
};

export default BuildSpecial;