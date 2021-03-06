const Sequelize = require('sequelize');

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = sequelize.import('./Models/Users');
const CurrencyShop = sequelize.import('./Models/CurrencyShop');
const UserItems = sequelize.import('./Models/UserItems');

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

Users.prototype.addItem = async (item, external_user_id) => {
	const userItem = await UserItems.findOne({
		where: { user_id: external_user_id, item_id: item.id },
	});

	if (userItem) {
		userItem.amount += 1;
		return userItem.save();
	}
	else {
		// The item doesn't exist in their inventory, so we need to tap the shop to get the info needed about the item we are looking for.
		const itemToBuy = await CurrencyShop.findOne({where: {id: item.id}});
		if(!itemToBuy){
			throw TypeError("Item given does not exist in user inventories or shop")
		}
		return UserItems.create({ user_id: external_user_id, item_id: itemToBuy.id, amount: 1, modifier: itemToBuy.modifier });
	} 

};

Users.prototype.subtractItem = async (item, external_user_id) => {
	const userItem = await UserItems.findOne({
		where: { user_id: external_user_id, item_id: item.id },
	});

	if (userItem < 1){
		return 1;
	};
	if (userItem) {
		userItem.amount -= 1;
		return userItem.save();
	}

	return UserItems.create({ user_id: external_user_id, item_id: item.id, amount: 1 });

};

Users.prototype.getItems = (external_user_id) => {
	if(external_user_id) {
		return UserItems.findAll({
			where: { user_id: external_user_id },
			include: ['item'],
	})};

};

module.exports = { Users, CurrencyShop, UserItems };