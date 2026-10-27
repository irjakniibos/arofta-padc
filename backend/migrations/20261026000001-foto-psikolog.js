'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('psikolog', 'foto_path', { type: Sequelize.STRING(255), allowNull: true });
    await queryInterface.addColumn('psikolog', 'foto_mime', { type: Sequelize.STRING(100), allowNull: true });
    await queryInterface.addColumn('psikolog', 'foto_updated_at', { type: Sequelize.DATE, allowNull: true });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('psikolog', 'foto_path');
    await queryInterface.removeColumn('psikolog', 'foto_mime');
    await queryInterface.removeColumn('psikolog', 'foto_updated_at');
  },
};
