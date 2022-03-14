const {Keyword, Piece, Serp} = require('./libs/database');

(async function() {
    await Keyword.sync({ force: true });
    await Piece.sync({ force: true });
    await Serp.sync({ force: true });
})();