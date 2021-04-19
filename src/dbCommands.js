const { User } = require("discord.js");
const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "username", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "./src/KanbanDB.db",
  define: {
    timestamps: false,
    freezeTableName: true,
  },
});
// models
const Users = require("./models/Users")(sequelize, Sequelize.DataTypes);
const Board = require("./models/Board")(sequelize, Sequelize.DataTypes);
const Tasks = require("./models/Tasks")(sequelize, Sequelize.DataTypes);
const ColumnStatus = require("./models/Column_Status")(sequelize, Sequelize.DataTypes);
const ColumnTrack = require("./models/Column_Track")(sequelize, Sequelize.DataTypes);
const Column = require("./models/Column")(sequelize, Sequelize.DataTypes);
const Config = require("./models/Config")(sequelize, Sequelize.DataTypes);
const Task_Assignment = require("./models/Task_Assignment")(sequelize,Sequelize.DataTypes);

// global scope
async function createUser(username) { //function to add user
	const created_at = Math.floor(+new Date() / 1000); //calculates date as integer
	const user = await Users.create({ discord_username: username, created_at_date_stamp: created_at}).catch(error => { //adds to database
		console.log(error);
	});
	return user;
}; 

async function findUser(username) { //function to find user
	const foundUser = await Users.findOne({
		where: { discord_username: username }, //attempts to match username paramter (target.tag) to column name discord_username
	});
	return foundUser;
};


//boards
async function createBoard(data) {
  data["created_at_date_time_stamp"] = Math.floor(+new Date() / 1000); //calculates date as integer
  const board = await Board.create(data).catch((error) => {
    console.log(error);
  });
  return board;
}

async function findBoardByName(boardName) {
  //function to find user
  const foundBoardByName = await Board.findOne({
    where: { name: boardName },
  });
  return foundBoardByName;
}


//column status
async function findAllColumnStatus() {
  const allStatus = await ColumnStatus.findAll({
    attributes: ["column_status_id"],
  });
  return allStatus;
}

//column track
async function createColumnTrackRecord(data) {
  data["created_at_date_time_stamp"] = Math.floor(+new Date() / 1000);
  await ColumnTrack.create(data).catch((error) => {
    console.log(error);
  });
}

//column
async function createColumn(data) {
  data["created_at_date_time_stamp"] = Math.floor(+new Date() / 1000); //calculates date as integer
  const column = await Column.create(data).catch((error) => {
    console.log(error);
  });
  return column;
}

async function createConfig(serverId) {
  //function to add config record to db
  await Config.create({ server_id: serverId, prefix: "%" }).catch((error) => {
    //adds to config table in database
    console.log(error);
  });
}

//function to update config record
async function updateConfig(data) {
  const updatedConfig = await Config.update(data.updatedFields, {
    where: data.conditionalFields,
  }).catch((error) => {
    console.log(error);
  });
  return updatedConfig;
}

async function findConfigByServerId(serverId) {
  //function to find server id
  const configModel = await Config.findOne({
    where: { server_id: serverId }, //attempts to match server id in db to the server id of the current message
  });
  return configModel;
}

async function updateBoard(data) {
  data.updatedFields["updated_at_date_time_stamp"] = Math.floor(
    +new Date() / 1000
  ); //calculates date as integer
  await Board.update(data.updatedFields, { where: data.updateCondition }).catch(
    (error) => {
      //updates config table in database
      console.log(error);
    }
  );
}

async function findColumnNameByBoardIdAndName(boardId, columnName) { //function to find server id
	const columnModel = await Column.findOne({
		where: { name: columnName, board_id: boardId }, //attempts to match server id in db to the server id of the current message
	});
	return columnModel;
};
// temp version, gonna need a more efficent way but would like to focus on the implementation first
async function findAllColumnNamesByBoardId(boardId) {
	const columnModel = await Column.findAll({
		where: { board_id: boardId },
	});
	return columnModel;
};

async function findColumnTrackIdByColumnId(ColumnId) {
	const columnTrackModel = await ColumnTrack.findAll({
		where: { column_id: ColumnId },
	});
	return columnTrackModel;
};




async function updateColumn(data) {
  data.updatedFields["updated_at_date_time_stamp"] = Math.floor(
    +new Date() / 1000
  ); //calculates date as integer
  await Column.update(data.updatedFields, {
    where: data.updateCondition,
  }).catch((error) => {
    //updates config table in database
    console.log(error);
  });
}

//get date
function getFormattedDate(dateInput){
	let formattedDate;
	if(dateInput === null) {
		formattedDate = 'Nothing'
	} else {
		let date = new Date(dateInput);
		let year = date.getFullYear();
		let month = date.getMonth();
		month += 1;
		let day = date.getDate();

		formattedDate = year + '-' + month + '-' + day; 
	}
	
	return formattedDate;
}

async function findTaskByColumnIdAndName(columnId, taskName){
	const [results, metadata] = await sequelize.query("SELECT * FROM Tasks JOIN Column_track ON Tasks.column_track_id = Column_track.column_track_id WHERE Column_track.column_id = " + columnId + " AND tasks.name = '" + taskName + "'");
	return results[0];
}

async function findAllBoardColumnsByBoardId(boardId){
	const results = await sequelize.query(
	"SELECT c.name colName, ct.column_track_id columnTrackId "+
	"FROM Board b "+
	"JOIN Column c on b.board_id = c.board_id "+
	"JOIN Column_track ct on c.column_id = ct.column_id "+
	"WHERE b.board_id = :boardId; ",
	 { replacements: { boardId: boardId },type: Sequelize.SELECT }
	);
	return results;
}

async function findTasksByColumnTrackId(columnTrackId){
	const results = await sequelize.query(
		"SELECT t.name taskName, cs.name colStatus"+
		" FROM Tasks t"+
		" JOIN Column_track ct on ct.column_track_id = t.column_track_id"+
		" JOIN Column_status cs on ct.column_status_id = cs.column_status_id"+
		" WHERE t.column_track_id = :columnTrackId; ",
		{ replacements: { columnTrackId: columnTrackId },type: Sequelize.SELECT }
	);
	return results;
}

async function updateTask(data){
	data.updatedFields["updated_at_date_time_stamp"] = Math.floor(+new Date() / 1000); //calculates date as integer
	await Tasks.update(
			data.updatedFields, 
			{where: data.updateCondition}
		).catch(error => { //updates config table in database
		console.log(error);
	});
};


async function findMaxColumnTrackId(columnId){
	const foundColumnId = await ColumnTrack.max(
		'column_track_id', 
		{where:{ column_id: columnId }}
	)
	return foundColumnId;
}

async function findMaxColumnId(boardId){
	const foundColumnId = await Column.max(
		'column_id', 
		{where:{ board_id: boardId }}
	)
	return foundColumnId;
}

async function findColumnTrackByTaskTrackId(trackId) { //function to find server id
	const columnTrackModel = await ColumnTrack.findOne({
		where: { column_track_id: trackId }, //attempts to match server id in db to the server id of the current message
	});
	return columnTrackModel;
};

async function countBoardColumns(boardId) {
	const columnCount = Column.count({
		where: { board_id: boardId }
	})
	return columnCount;
}

//task
async function createTask(data) {
  data["created_at_date_time_stamp"] = Math.floor(+new Date() / 1000); //calculates date as integer
  const task = await Tasks.create(data).catch((error) => {
    console.log(error);
  });
  return task;
}

async function findMinColumnTrackId(columnId){
	const foundColumnId = await ColumnTrack.min(
		'column_track_id', 
		{where:{ column_id: columnId }}
	)
	return foundColumnId;
}

//assignTask
async function assignTask(data) {
  data["created_at_date_time_stamp"] = Math.floor(+new Date() / 1000); //calculates date as integer
  const assignTaskToUsers = await Task_Assignment.create(data).catch((error) => {
    console.log(error);
  });
  return assignTaskToUsers;
}

//find task id
async function findTaskId(taskId) {
  const foundTaskId = await Board.findOne({
    where: { task_id: taskId },
  });
  return foundTaskId;
}

module.exports = {
  createUser,
  findUser,
  createConfig,
  findConfigByServerId,
  findBoardByName,
  createBoard,
  createColumn,
  createColumnTrackRecord,
  findAllColumnStatus,
  updateBoard,
  findColumnNameByBoardIdAndName,
  updateColumn,
  getFormattedDate,
  updateConfig,
  findTaskByColumnIdAndName,
  updateTask,
  countBoardColumns,
  createTask,
  findMaxColumnTrackId,
  findMaxColumnId,
  findColumnTrackByTaskTrackId,
  findMinColumnTrackId,
  assignTask,
  findTaskId,
  findAllColumnNamesByBoardId,
	findColumnTrackIdByColumnId,
	findTasksByColumnTrackId,
	findAllBoardColumnsByBoardId
}; 
