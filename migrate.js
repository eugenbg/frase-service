const {Keyword, Piece} = require('./libs/database');

(async function() {
    await Keyword.sync({ force: true });
    await Piece.sync({ force: true });
})();