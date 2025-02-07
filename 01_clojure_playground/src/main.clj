(ns playground
  (:require [clojure.pprint :as pp]))

(defmacro defchecker [checkername args & body]
  `(defn ~checkername ~args
     (let [~'check (fn [check-name# the-cond#]
                     (if the-cond#
                       (println (str "[check] " check-name# " result=pass."))
                       (println (str "[check] " check-name# " result=failed."))))]
       ~@body)))

; (pp/pprint
;   (macroexpand-1
;     '(defchecker checker-1 [foobar]
;        (check (= foobar 1)))))

(defchecker checker-1 [foobar]
  (check :foobar-should-be-1 (= foobar 1))
  (check :yes-it-is-true (> foobar 0)))

(checker-1 1)

