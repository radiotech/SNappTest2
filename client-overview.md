# SNapp

This project aims to meet the needs of beginning music students who want to start playing an instrument without first learning to read traditional sheet music. The goal of this project is to make [WYSIWYP notation](http://comp523k.web.unc.edu/project/) freely available and easily accessible to music students.

## Architecture

These instructions will allow you to get a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

<img src="http://comp523k.web.unc.edu/files/2019/10/Architecture-Diagram.png" width="350"></img>

1. GitHub pages(now migrated to another site host by the client). This will be the source to retrieve webpage data and react code. Basically where is the program is stored. 
Browser storage. 
2. The browser storage stores recently converted MusicXML files locally in localStorage API. So return users can see their converted files before. 
3. Local file system.	Users will import the files they want to convert to WYSIWYP notation from their local file system. They can also save their preferences and import their preferences from here. 
4. React client. The React client will interact with all those three components to display a functional app. 

## Deployment

The project is currently deployed using [this site](https://pages.github.com/). The deployment can be updated by modifying the contents of this branch in GitHub. This is where the live app lives. The app is generally available. 
(the second link needs to be changed to the new site)

## Cost 

## Access
The client has admin access over the infrastructure. The project can be deployed by running rpm run build from the client directory. All code can be accessed form [GitHub directory](https://github.com/WYSIWYP/SNapp). 

## User stories
All the need-to-have user stories are complete. 
The nice to have user story we completed: 
As an advanced user, in order to add fingerings to a piece or fix issues with imported sheet music, I can access a page which lets me transpose the piece to another key or edit note properties.

## Highest Priority 
For the project: The project is ready to move on to getting user feedback from music players.
For the code: 