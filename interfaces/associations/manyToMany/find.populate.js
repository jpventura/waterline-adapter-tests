var assert = require('assert');
var _ = require('@sailshq/lodash');

describe('Association Interface', function() {
  describe('n:m association :: .find().populate()', function() {
    var driverRecord;

    before(function(done) {
      Associations.Driver.create({ name: 'manymany find'}, function(err, driver) {
        if (err) {
          return done(err);
        }

        driverRecord = driver;

        var taxis = [];
        for(var i=0; i<2; i++) {
          taxis.push({ medallion: i });
        }

        Associations.Taxi.createEach(taxis, function(err, taxis) {
          if (err) {
            return done(err);
          }

          var childrenIds = _.map(taxis, function(taxi) {
            return taxi.id;
          });

          Associations.Driver.addToCollection(driver.id, 'taxis', childrenIds)
          .exec(function(err) {
            if (err) {
              return done(err);
            }

            return done();
          });
        });
      });
    });

    it('should return taxis when the populate criteria is added', function(done) {
      Associations.Driver.find({ name: 'manymany find' })
      .populate('taxis')
      .exec(function(err, drivers) {
        if (err) {
          return done(err);
        }

        assert(_.isArray(drivers));
        assert.equal(drivers.length, 1);
        assert(_.isArray(drivers[0].taxis));
        assert.equal(drivers[0].taxis.length, 2);

        return done();
      });
    });

    it('should not return a taxis object when the populate is not added', function(done) {
      Associations.Driver.find()
      .exec(function(err, drivers) {
        if (err) {
          return done(err);
        }

        assert(!drivers[0].taxis);

        return done();
      });
    });

    it('should destroy join table records when the cascade flag is set', function(done) {
      // Get the records in the join table and ensure records exist
      Associations.Driver_taxis__taxi_drivers.find()
      .exec(function(err, preDestroyRecords) {
        if (err) {
          return done(err);
        }

        // Ensure there are two join records
        assert.equal(preDestroyRecords.length, 2);

        // Destroy all the drivers and cascade the method
        Associations.Driver.destroy()
        .meta({
          cascade: true
        })
        .exec(function(err) {
          if (err) {
            return done(err);
          }

          // Get the records in the join table and ensure nothing is left
          Associations.Driver_taxis__taxi_drivers.find()
          .exec(function(err, postDestroyRecords) {
            if (err) {
              return done(err);
            }

            assert.equal(postDestroyRecords.length, 0);

            return done();
          });
        });
      });
    });
  });
});
