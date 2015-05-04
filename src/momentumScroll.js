'use strict';

angular.module('ui-momentum-scroll', [])
/**
 * @ngdoc directive
 * @name app:ui-momentum-scroll
 * @restrict A
 * @scope false
 *
 * @description
 * Momentum scroll used by touchmove and translate
 *
 * @example
 * # Vertical scroll
 * <div style="height:100px;overflow:hidden;" momentum-scroll>
 *   <div style="height:1000px">..scroll content..</div>
 * </div>
 *
 * # Horizontal scroll
 * <div style="width:100%;overflow:hidden;" momentum-scroll momentum-scroll-horizontal>
 *   <div style="width:1000px">..scroll content..</div>
 * </div>
 *
 **/
  .directive('momentumScroll', function ($window) {

    var _directive = {
      restrict: 'A',
      scope: false,
      link: _link
    };

    var durationMap = {
      normal: '.5s',
      overEdge: '.1s',
      backEdge: '.2s'
    };
    var scrollPosMax = 200;
    var velocityGain = 5;
    var bouncePos = 50;
    var cubicBezier = 'cubic-bezier(0.33, 0.66, 0.66, 1)';
    var transitionEndEventName = _getTransitionEndEventName();

    function _link(scope, element, attrs) {

      var content = element.children().eq(0);
      var isHorizontalScroll = angular.isDefined(attrs.momentumScrollHorizontal);
      var startPos = 0;
      var diffPos = 0;
      var velocity = 0;
      var contentScrollTop = 0;
      var contentScrollTopMax = 0;

      if (transitionEndEventName) {
        content.on('touchstart', _onTouchStart);
        content.on('touchmove', _onTouchMove);
        content.on('touchend', _onTouchEnd);
      } else {
        element.css('overflow', 'scroll');
      }

      /**
       * touchStart
       * @param {Object} evt
       */
      function _onTouchStart(evt) {
        var contentHeight, wrapperHeight;

        startPos = _getTouchPos(evt);
        velocity = 0;
        diffPos = 0;

        contentHeight = _getElementOffset(content);
        wrapperHeight = _getElementOffset(element);
        if (wrapperHeight > contentHeight) {
          wrapperHeight = contentHeight;
        }
        contentScrollTopMax = contentHeight - wrapperHeight;

        content.off(transitionEndEventName);
      }

      /**
       * touchMove
       * @param {Object} evt
       */
      function _onTouchMove(evt) {
        // Difference between now diffPos and before diffPos
        velocity = (startPos - _getTouchPos(evt)) - diffPos;

        // Difference between touchstart position and touchmove position
        diffPos = startPos - _getTouchPos(evt);

        var nextScrollTop = contentScrollTop + diffPos;

        if (nextScrollTop > contentScrollTopMax) {
          nextScrollTop -= parseInt((nextScrollTop - contentScrollTopMax) / 2, 10);
        } else if (nextScrollTop < 0) {
          nextScrollTop = parseInt(nextScrollTop / 2, 10);
        }

        _changeContentTranslate(nextScrollTop);

        evt.preventDefault();
      }

      /**
       * touchEnd
       */
      function _onTouchEnd() {
        contentScrollTop += diffPos;

        if (contentScrollTop > contentScrollTopMax) {
          // Over bottom edge
          _scrollBackBottomEdge();

        } else if (contentScrollTop < 0) {
          // Over top edge
          _scrollBackTopEdge();

        } else if (velocity > 0) {
          // Scroll to bottom
          _scrollToBottom();

        } else if (velocity < 0) {
          // Scroll to top
          _scrollToTop();

        }
      }

      /**
       * Scroll back bottom edge
       */
      function _scrollBackBottomEdge() {
        contentScrollTop = contentScrollTopMax;
        _changeContentTranslate(contentScrollTop, durationMap.backEdge);
      }

      /**
       * Scroll back top edge
       */
      function _scrollBackTopEdge() {
        contentScrollTop = 0;
        _changeContentTranslate(0, durationMap.backEdge);
      }

      /**
       * Scroll to bottom
       */
      function _scrollToBottom() {
        var duration = durationMap.normal;
        contentScrollTop += Math.min(scrollPosMax, velocity * velocityGain);
        if (contentScrollTop > contentScrollTopMax + bouncePos) {
          contentScrollTop = contentScrollTopMax + bouncePos;
        }
        if (contentScrollTop > contentScrollTopMax) {
          duration = durationMap.overEdge;
        }

        content.on(transitionEndEventName, function () {
          content.off(transitionEndEventName);

          // Bounce to bottom edge
          if (contentScrollTop > contentScrollTopMax) {
            _scrollBackBottomEdge();
          }
        });
        _changeContentTranslate(contentScrollTop, duration);
      }

      /**
       * Scroll to top
       */
      function _scrollToTop() {
        var duration = durationMap.normal;
        contentScrollTop += Math.max(-1 * scrollPosMax, velocity * velocityGain);
        if (contentScrollTop < -1 * bouncePos) {
          contentScrollTop = -1 * bouncePos;
        }
        if (contentScrollTop < 0) {
          duration = durationMap.overEdge;
        }

        content.on(transitionEndEventName, function () {
          content.off(transitionEndEventName);

          // Bounce to top edge
          if (contentScrollTop < 0) {
            _scrollBackTopEdge();
          }
        });
        _changeContentTranslate(contentScrollTop, duration);
      }

      /**
       * Scroll used by css-transform
       * @param {Number} nextPos
       * @param {String} [duration]
       * @example
       * _changeContentTranslate(100, '.3s');
       * _changeContentTranslate(0);
       */
      function _changeContentTranslate(nextPos, duration) {
        var transitionStyle = duration ? ['all', cubicBezier, duration].join(' ') : '';
        var transformStyle = _getTransformValue(nextPos);
        content.css({
          '-moz-transition': transitionStyle,
          '-moz-transform': transformStyle,
          '-webkit-transition': transitionStyle,
          '-webkit-transform': transformStyle,
          transition: transitionStyle,
          transform: transformStyle
        });
      }

      /**
       * Get touch position
       * @param {Object} evt
       * @returns {Number}
       */
      function _getTouchPos(evt) {
        if (isHorizontalScroll) {
          return evt.touches[0].pageX;
        } else {
          return evt.touches[0].pageY;
        }
      }

      /**
       * Get element height or width
       * @param {Element} element
       * @returns {number}
       */
      function _getElementOffset(element) {
        if (isHorizontalScroll) {
          return element[0].offsetWidth;
        } else {
          return element[0].offsetHeight;
        }
      }

      /**
       * Get transform value
       * @param {Number} nextPos
       * @returns {string}
       */
      function _getTransformValue(nextPos) {
        if (isHorizontalScroll) {
          return 'translate3d(' + -1 * nextPos + 'px, 0, 0)';
        } else {
          return 'translate3d(0, ' + -1 * nextPos + 'px, 0)';
        }
      }
    }

    /**
     * FYI: https://github.com/minimalmonkey/minimalmonkey.github.io/blob/master/_src/js/utils/transitionEndEvent.js
     * @returns {String}
     */
    function _getTransitionEndEventName() {

      var t;
      var el = $window.document.createElement('fakeelement');
      var transitions = {
        transition: 'transitionend',
        OTransition: 'oTransitionEnd',
        MozTransition: 'transitionend',
        WebkitTransition: 'webkitTransitionEnd'
      };

      for (t in transitions) {
        if (el.style[t] !== undefined) {
          return transitions[t];
        }
      }
    }

    return _directive;
  });