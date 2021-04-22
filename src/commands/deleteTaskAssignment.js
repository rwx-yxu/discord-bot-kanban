let dbCmd  = require('../dbCommands.js');
let data = {};
function finalConfirmation(message){
	message.reply(`Changes Successfully made\n`
			+ 'Would you like to continue with these settings?\n'
			+ '`yes` to update task with new settings or `no` to cancel changes.\n'
			+ 'You have 30 seconds or else task will not be made.\n');

	message.channel.awaitMessages(m => m.author.id == message.author.id,
	{max: 1, time: 30000}).then(collected => {
		if (collected.first().content.toLowerCase() === 'yes') {
			deleteBoardAndColumn(message);
		} else if(collected.first().content.toLowerCase() === 'no') {	
			message.reply('Your changes have been cancelled.\n' 
						+ 'Your task has not been affected');
		} else {
			message.reply('That is not a valid response\n'
			+ 'Please retype edittask command');
		}
	}).catch(() => {
		message.reply('No answer after 30 seconds, operation canceled.');
	});
}

function deleteBoardAndColumn(message){
	dbCmd.deleteTaskAssignment(data.taskAssignment).then(()=>{
		message.reply('Your board has successfully been deleted.');
	});
}

function setData() {
	data = {
        taskAssignment:[],
	};
}
module.exports = {
	name: 'unassignuser',
	description: 'deletecolumn <board name> <column name> <task name> <username>',
	count: 7,
	execute(message, args) {
        let boardNameInput = args[0];
        let columnNameInput = args[1];
        let taskNameInput = args[1];
		let userNameInput = message.mentions.users.first() || message.author;

		setData();
		
		if (!boardNameInput|| !columnNameInput|| !taskNameInput|| !userNameInput) {
			return message.reply('you need to name a board!\n'
			+ 'example: %editboard <board name>');
		} else {
			dbCmd.findUser(userNameInput.tag).then((userModel) =>{
				if(userModel === null){
					message.channel.send(`that user does not exist in the DB`);
				} else {
					let foundUser = userModel.user_id;
					dbCmd.findBoardByName(boardNameInput).then((boardModel) =>{
						if(boardModel !== null){
							dbCmd.findAllColumnNamesByBoardId(boardModel.board_id).then((columnModels) => {		
								let columnOrderNumberCheck = false;	
								let columnOrderNumberIndex = 0;		
								for (let i = 0; i < columnModels.length; i++) {
									if (columnModels[i].name == columnNameInput){
										columnOrderNumberCheck = true;
										columnOrderNumberIndex = i;
										dbCmd.findAllColumnTracksByColumnId(columnModels[i].column_id).then((columnTrackModels)=>{
											for (let j = 0; j < columnTrackModels.length; j++) {
												dbCmd.findAllTasksByColumnTrackId(columnTrackModels[j].column_track_id).then((taskModels)=>{
													if (taskModels.length !== 0){
														for (let m = 0; m < taskModels.length; m++) {
															dbCmd.findAllTaskAssignmentsByTaskId(taskModels[m].task_id).then((taskAssignmentsModels)=>{
																if (taskAssignmentsModels !== undefined || taskAssignmentsModels[0].length !== 0){
																	for (let n = 0; n < taskAssignmentsModels.length; n++) {
																		if(taskAssignmentsModels[n].user_id == foundUser){
																			data.taskAssignment.push(taskAssignmentsModels[n].task_assignment_id);
																		}
																	};
																}
															});
														}
													}
												});
											}
										});
									}
								};
								// console.log(data.updateColumnOrderNumber);
								finalConfirmation(message);
							});
						} else {
							message.channel.send(`${nameInput} doesn't exist in the DB`);
						}
					});
				}
			});
		}
	},
};