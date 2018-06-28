import { Component, OnInit, AfterViewChecked, ElementRef, ViewChild } from '@angular/core';
import { ChatService } from '../chat.service';
import { HttpService } from './../http.service';
import * as io from "socket.io-client";
import { ActivatedRoute, Params, Router } from '@angular/router';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer: ElementRef;
  chats:any;
  joined: boolean = false;
  newUser = { nickname: '', room: '' };
  msgData = { room: '', nickname: '', message: '' };
  socket = io.connect();

  constructor(private chatService: ChatService,
    private _httpService: HttpService,
    private _router: Router) { }

  ngOnInit() {
    this.getUser();
    var user = JSON.parse(localStorage.getItem("user"));
    if(user!=null) {
      this.getChatByRoom(user.room);
      this.msgData = { room: user.room, nickname: user.nickname, message: '' }
      this.joined = true;
      this.scrollToBottom();
    }
    this.socket.on('new-message', function (data) {
      if(this.joined){
        if(data.message["_body"]){
          var temp = JSON.parse(data.message["_body"]);
        } else {
          var temp = data["message"];
        }
        if(temp.room === JSON.parse(localStorage.getItem("user")).room && this.chats) {
          this.chats.push(temp);
          this.msgData.message = '';
          this.scrollToBottom();
        }
      }
    }.bind(this));
  }
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  getChatByRoom(room) {
    let observable = this.chatService.getChatByRoom(room);
    observable.subscribe(data => {
      this.chats = JSON.parse(data["_body"]);
    });
  }

  joinRoom() {
    localStorage.setItem("user", JSON.stringify(this.newUser));
    this.getChatByRoom(this.newUser.room);
    this.msgData = { room: this.newUser.room, nickname: this.newUser.nickname, message: '' };
    this.joined = true;
    this.socket.emit('save-message', { room: this.newUser.room, nickname: this.newUser.nickname, message: 'Join this room'});
  }
  getUser(){
    let loggedIn = this._httpService.getUser();
    loggedIn.subscribe(data =>{
      this.msgData = { room: "general", nickname: data['user'].username, message: '' };
      this.joined = true;
      localStorage.setItem("user", JSON.stringify({ nickname: this.msgData.nickname, room: this.msgData.room }));
      this.socket.emit('save-message', { room: this.msgData.room, nickname: this.msgData.nickname, message: 'Join this room'});
    });
  }

  sendMessage() {
    console.log(this.msgData);
    let observable = this.chatService.saveChat(this.msgData);
    observable.subscribe(data => {
      this.socket.emit('save-message', data);
    });
  }

  // logout() {
  //   var user = JSON.parse(localStorage.getItem("user"));
  //   this.socket.emit('save-message', { room: user.room, nickname: user.nickname, message: 'Left this room'});
    
  //   this.newUser = { nickname: '', room: '' };
  //   this.msgData = { room: '', nickname: '', message: '' };
  //   this.joined = false;
  //   localStorage.removeItem("user");
  // }

}