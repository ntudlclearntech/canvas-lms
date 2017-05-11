/*
 * Copyright (C) 2014 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

define(function(require) {
  var Subject = require('jsx!views/summary/score_percentile_chart');
  var tick;

  var testRects = function(bars, done) {
    setTimeout(function() {
      bars.forEach(function(bar) {
        var index = bar.i;
        rect = find('rect.bar:nth-of-type(' + (index+1) + ')');
        expect(rect.x.baseVal.value).toEqual(bar.x, 'rect[' + index + '][x]');
        expect(rect.y.baseVal.value).toEqual(bar.y, 'rect[' + index + '][y]');
        expect(rect.height.baseVal.value).toEqual(bar.h, 'rect['+index+'][h]');
      });

      if (done) done();
    }, (tick += 5));
  };

  describe('ScorePercentileChart', function() {
    this.reactSuite({
      type: Subject,
      initialProps: {
        animeDelay: 0,
        animeDuration: 0,
        width: 960,
        height: 240,
        minBarHeight: 2
      }
    });

    beforeEach(function() {
      tick = 10;
    });

    it('should render', function() {
      expect(subject.isMounted()).toEqual(true);
    });

    it('should render a bar for each percentile', function() {
      expect(findAll('rect.bar').length).toEqual(101);
    });

    it('should add a description each bar', function() {
      setProps({
        scores: {
          1: 1,]
          62: 2
        }
      });

      var summaryText = find('#summary-statistics').innerText;
      expect(summaryText).toContain('2 students in percentile 62');
    });

    it('bar height should be based on score frequency', function(done) {
      setProps({
        scores: {
          15: 1,
          25: 1,
          44: 1,
          50: 1,
          59: 2
        }
      });

      testRects([
        { i: 15, x: 136, y: 88, h: 92 },
        { i: 25, x: 226, y: 88, h: 92 },
        { i: 44, x: 397, y: 88, h: 92 },
        { i: 59, x: 532, y: -2,  h: 182 },
      ], done);
    });

    it('should update', function(done) {
      var rect;

      setProps({
        scores: {
          15: 1,
        }
      });

      testRects([
        { i: 15, x: 136, y: -2, h: 182 },
        { i: 25, x: 226, y: 178, h: 2 },
      ], function updatePropsAnotherTime() {
        setProps({
          scores: {
            15: 1,
            25: 1,
          }
        });

        testRects([
          { i: 15, x: 136, y: -2, h: 182 },
          { i: 25, x: 226, y: -2, h: 182 },
        ], done);
      });
    });

    it('should render scores for the 0th and 100th percentiles', function(done) {
      setProps({
        scores: {
          0: 1,
          100: 5
        }
      });

      testRects([
        { i: 0,   x: 1,  y: 142, h: 38  },
        { i: 100, x: 901, y: -2,  h: 182 },
      ], done);
    });

    describe('#calculateStudentStatistics', function() {
      it('should work', function() {
        var output = subject.calculateStudentStatistics(3, [ 0, 1, 1, 1, 2 ]);
        expect(output.aboveAverage).toBe(3); // includes the average
        expect(output.belowAverage).toBe(2);
      });
    });
  });
});
