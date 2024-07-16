import { getRndNum } from "../utils/utils";
import InputManager from "./inputManager";

enum MoveDir{none,top,right,bottom,left};
enum GameState{started,done,gameover}
interface GameBlock{
    uid:number,
    elem:HTMLElement,
    num:number,
    row:number,
    col:number,
    justMerged:boolean
}
class Game2048{
    static BLOCKS_UIDS=1;
    static blocksContainerID="gameBlocksContainer";
    static stepsLabelID="gameStepsLabel";
    static retryBtnID="gameRetryBtn";
    static blocksContainerPadding=12;
    static blockSpeed=1*7;
    static moveAnimationDuration=700;
    static mergeAnimationDuration=700;
    gameState!:GameState;
    steps!:number;
    blocks!:(GameBlock)[];
    slots!:(GameBlock|null)[][];
    blocksContainer:HTMLElement;stepsLabel:HTMLElement;retryBtn:HTMLElement;
    isMoving!:boolean;
    willMergeAtAnimationEnd!:[block1:GameBlock,block2:GameBlock][];

    get canMove():boolean{return !this.isMoving&&this.gameState===GameState.started;}

    constructor(){
        this.blocksContainer=document.getElementById(Game2048.blocksContainerID)!;
        this.stepsLabel=document.getElementById(Game2048.stepsLabelID)!;
        this.retryBtn=document.getElementById(Game2048.retryBtnID)!;
        window.addEventListener('resize',()=>{
            this.redrawBlocks();
        });
        this.retryBtn.onclick=(_e:MouseEvent)=>this.onRetry();
        InputManager.init((key:string)=>this.checkInputs(key));
        this.resetGame();
        document.getElementById("logBtn")!.onclick=()=>this.onLogBtn();
    }
    onLogBtn(){
        console.log(this.blocks);
        console.table(this.slots.map((row)=>row.map(b=>b?.num)));
        console.log("________________");
    }

    start(){
        this.addNewRandomBlock();
        this.addNewRandomBlock();
        this.gameState=GameState.started;
    }

    resetGame(){
        this.gameState=GameState.done;
        if(this.blocks){console.log(this.blocks)
            for(let i=this.blocks.length-1;i>=0;i--){this.removeBlock(this.blocks[i]);}
        }else{
            this.blocks=[];
        }
        this.slots=Array(4).fill(null).map((_row,_i)=>[null,null,null,null]);
        this.isMoving=false;
        this.willMergeAtAnimationEnd=[];
        this.steps=0;
        this.stepsLabel.innerText=`Steps: ${this.steps}`;
    }
    onRetry(){
        if(confirm("Retry")){
            this.resetGame();
            this.start();
        }
    }
    checkInputs(key:string){
        if(key==="ArrowUp"){
            this.move(MoveDir.top);
        }else if(key==="ArrowDown"){
            this.move(MoveDir.bottom);
        }else if(key==="ArrowLeft"){
            this.move(MoveDir.left);
        }else if(key==="ArrowRight"){
            this.move(MoveDir.right);
        }
    }
    redrawBlocks(){
        this.blocksContainer.innerHTML="";
        this.blocks.forEach((block,i)=>{
            if(block){
                block.elem=Game2048.createNewBlockElem(block.num,i);
                this.addBlockToDOM(block);
            }
        });
    }

    move(dir:MoveDir){
        if(!this.canMove)return;
        this.isMoving=true;
        switch(dir){
            case MoveDir.top:
            this.blocks.sort((a,b)=>a.row-b.row).forEach((b,_i)=>this.moveBlock(b,dir));
            break;
            case MoveDir.bottom:
            this.blocks.sort((a,b)=>b.row-a.row).forEach((b,_i)=>this.moveBlock(b,dir));
            break;
            case MoveDir.left:
            this.blocks.sort((a,b)=>a.col-b.col).forEach((b,_i)=>this.moveBlock(b,dir));
            break;
            case MoveDir.right:
            this.blocks.sort((a,b)=>b.col-a.col).forEach((b,_i)=>this.moveBlock(b,dir));
            break;
        }
        setTimeout(()=>this.onMoveFinished(),Game2048.moveAnimationDuration);
    }
    moveBlock(block:GameBlock,dir:MoveDir){
        switch(dir){
            case MoveDir.top:
            {
                const filledBeforeCount:number=this.getFilledSlotsCountAtCol(block.col,block.row-1,true);
                let offs:number=-block.row+filledBeforeCount;//console.log(filledAfterCount,offs);
                this.slots[block.row][block.col]=null;
                const topBlock:GameBlock|undefined|null=this.getBlockAt(block.col,block.row+offs-1);
                if(topBlock&&topBlock.num===block.num&&!topBlock.justMerged){
                    block.num=topBlock.num=block.num*2;
                    offs--;
                    this.willMergeAtAnimationEnd.push([block,topBlock]);
                    block.justMerged=true;
                    topBlock.justMerged=true;
                }
                block.row+=offs;
                this.slots[block.row][block.col]=block;
                const newPos:number=parseInt(block.elem.style.top)+Game2048.getBlockSize()*offs+Game2048.blocksContainerPadding*offs;
                block.elem.style.top=`${newPos}px`;
            }
            break;
            case MoveDir.bottom:
            {
                const filledAfterCount:number=this.getFilledSlotsCountAtCol(block.col,block.row+1);
                let offs:number=3-block.row-filledAfterCount;//console.log(filledAfterCount,offs);
                this.slots[block.row][block.col]=null;
                const bottomBlock:GameBlock|undefined|null=this.getBlockAt(block.col,block.row+offs+1);
                if(bottomBlock&&bottomBlock.num===block.num&&!bottomBlock.justMerged){
                    block.num=bottomBlock.num=block.num*2;
                    offs++;
                    this.willMergeAtAnimationEnd.push([block,bottomBlock]);
                    block.justMerged=true;
                    bottomBlock.justMerged=true;
                }
                block.row+=offs;
                this.slots[block.row][block.col]=block;
                const newPos:number=parseInt(block.elem.style.top)+Game2048.getBlockSize()*offs+Game2048.blocksContainerPadding*offs;
                block.elem.style.top=`${newPos}px`;
            }
            break;
            case MoveDir.left:
            {
                const filledBeforeCount:number=this.getFilledSlotsCountAtRow(block.row,block.col-1,true);
                let offs:number=-block.col+filledBeforeCount;//console.log(filledAfterCount,offs);
                this.slots[block.row][block.col]=null;
                const leftBlock:GameBlock|undefined|null=this.getBlockAt(block.col+offs-1,block.row);
                if(leftBlock&&leftBlock.num===block.num&&!leftBlock.justMerged){
                    block.num=leftBlock.num=block.num*2;
                    offs--;
                    this.willMergeAtAnimationEnd.push([block,leftBlock]);
                    block.justMerged=true;
                    leftBlock.justMerged=true;
                }
                block.col+=offs;
                this.slots[block.row][block.col]=block;
                const newPos:number=parseInt(block.elem.style.left)+Game2048.getBlockSize()*offs+Game2048.blocksContainerPadding*offs;
                block.elem.style.left=`${newPos}px`;
            }
            break;
            case MoveDir.right:
            {
                const filledAfterCount:number=this.getFilledSlotsCountAtRow(block.row,block.col+1);
                let offs:number=3-block.col-filledAfterCount;//console.log(filledAfterCount,offs);
                this.slots[block.row][block.col]=null;
                const rightBlock:GameBlock|undefined|null=this.getBlockAt(block.col+offs+1,block.row);
                if(rightBlock&&rightBlock.num===block.num&&!rightBlock.justMerged){
                    block.num=rightBlock.num=block.num*2;
                    offs++;
                    this.willMergeAtAnimationEnd.push([block,rightBlock]);
                    block.justMerged=true;
                    rightBlock.justMerged=true;
                }
                block.col+=offs;
                this.slots[block.row][block.col]=block;
                const newPos:number=parseInt(block.elem.style.left)+Game2048.getBlockSize()*offs+Game2048.blocksContainerPadding*offs;
                block.elem.style.left=`${newPos}px`;
            }
            break;
        }
    }

    addNewRandomBlock(){
        if(this.blocks.length===16)return;
        const num:number=Math.random()>0.1?2:4;
        this.addNewBlockAt(num);
    }
    addNewBlockAt(num:number,atIdx:number=-1){
        const newBlockIdx:number=atIdx>-1?atIdx:getRndNum(0,16,this.blocks.filter((b,_i)=>b!==null).map((b,_i)=>Game2048.get1DIndex(b!.col,b!.row)));
        const twoDIdx=Game2048.get2DIndices(newBlockIdx);
        const elem:HTMLElement=Game2048.createNewBlockElem(num,newBlockIdx);
        const newBlock:GameBlock={uid:Game2048.BLOCKS_UIDS++,num:num,elem:elem,col:twoDIdx[0],row:twoDIdx[1],justMerged:false};
        this.slots[newBlock.row][newBlock.col]=newBlock;
        this.blocks.push(newBlock);
        this.addBlockToDOM(newBlock);
    }
    addBlockToDOM(block:GameBlock){
        block.elem=Game2048.createNewBlockElem(block.num,Game2048.get1DIndex(block.col,block.row));
        this.blocksContainer.appendChild(block.elem);
        setTimeout(()=>{
            block.elem.style.transform="scale(1.1)";
            setTimeout(()=>{
                block.elem.style.transform="scale(1)";
            },Game2048.mergeAnimationDuration*0.5);
        },100);
    }
    removeBlock(block:GameBlock){
        block.elem.parentElement?.removeChild(block.elem);
        this.blocks=this.blocks.filter((b,_i)=>b!==block);
    }

    onMoveFinished(){
        this.willMergeAtAnimationEnd.forEach(pair=>{
            const num:number=pair[0].num;
            const pos:[col:number,row:number]=[pair[0].col,pair[0].row];
            const idx:number=Game2048.get1DIndex(pos[0],pos[1]);
            this.removeBlock(pair[0]);
            this.removeBlock(pair[1]);
            this.addNewBlockAt(num,idx);
        });
        this.willMergeAtAnimationEnd=[];
        this.addNewRandomBlock();
        this.isMoving=false;
        this.gameState=this.checkGameOverOrGameDone();
        if(this.gameState===GameState.done)this.onGameDone();
        else if(this.gameState===GameState.gameover)this.onGameOver();
        this.steps++;
        this.stepsLabel.innerText=`Steps: ${this.steps}`;
    }
    checkGameOverOrGameDone():GameState{
        if(this.blocks.find((b,_i)=>b.num===2048))return GameState.done;
        if(this.blocks.length===16){
            for(let blockIdx in this.blocks){
                if(this.checkBlockMergePossibility(this.blocks[blockIdx]))return GameState.started;
            }
        }else{
            return GameState.started;
        }
        return GameState.gameover;
    }
    checkBlockMergePossibility(block:GameBlock):boolean{
        const topBlock=this.getBlockAt(block.col,block.row-1);
        if(topBlock&&topBlock.num===block.num)return true;
        const bottomBlock=this.getBlockAt(block.col,block.row+1);
        if(bottomBlock&&bottomBlock.num===block.num)return true;
        const leftBlock=this.getBlockAt(block.col-1,block.row);
        if(leftBlock&&leftBlock.num===block.num)return true;
        const rightBlock=this.getBlockAt(block.col+1,block.row);
        if(rightBlock&&rightBlock.num===block.num)return true;
        return false;
    }

    onGameDone(){
        setTimeout(()=>{
            alert("Game Done!\n2048 Reached!");
        },Game2048.mergeAnimationDuration);
    }
    onGameOver(){
        setTimeout(()=>{
            alert("Game Over!");
        },Game2048.mergeAnimationDuration);
    }

    getBlockAt(col:number,row:number):GameBlock|null|undefined{
        return this.blocks.find((b,_i)=>b&&b.col===col&&b.row===row);
    }
    getFilledSlotsCountAtRow(rowIdx:number,startCol:number=0,before:boolean=false):number{
        return !before?this.slots[rowIdx].filter((s,col)=>col>=startCol&&s).length:
        this.slots[rowIdx].filter((s,col)=>col<=startCol&&s).length;
    }
    getFilledSlotsCountAtCol(colIdx:number,startRow:number=0,before:boolean=false):number{
        let count=0;
        this.slots.forEach((row,i)=>{
            if(!before&&i>=startRow&&row[colIdx]!=null)count++;
            else if(before&&i<=startRow&&row[colIdx]!=null)count++;
        });
        return count;
    }

    static createNewBlockElem(num:number,idx:number):HTMLElement{
        const blockSize:number=Game2048.getBlockSize();
        const elem:HTMLElement=document.createElement("div");
        elem.className=`moveableGameBlock gameBlock-${num} ${num>=128?'lightText':''}`;
        elem.innerText=num.toString();
        elem.style.width=`${blockSize}px`;
        elem.style.height=`${blockSize}px`;
        const pos:[px:number,py:number]=Game2048.getBlockPositionAtIdx(idx);
        elem.style.left=`${pos[0]}px`;
        elem.style.top=`${pos[1]}px`;
        return elem;
    }

    static getBlockPositionAtIdx(idx:number):[px:number,py:number]{
        const blockSize:number=Game2048.getBlockSize();
        const idxs:[xidx:number,yidx:number]=Game2048.get2DIndices(idx);
        const px:number=idxs[0]*blockSize+(idxs[0]+1)*Game2048.blocksContainerPadding;
        const py:number=idxs[1]*blockSize+(idxs[1]+1)*Game2048.blocksContainerPadding;
        return [px,py];
    }

    static getBlockSize():number{
        const specialRefBlock:HTMLElement=document.getElementById("specialRefBlock")!;
        return specialRefBlock.getBoundingClientRect().width;
    }

    static get2DIndices(idx:number):[xidx:number,yidx:number]{
        const xidx:number=idx%4;
        const yidx=Math.floor(idx/4);
        return [xidx,yidx];
    }
    static get1DIndex(xidx:number,yidx:number):number{
        return xidx+yidx*4;
    }

}

export default Game2048;
