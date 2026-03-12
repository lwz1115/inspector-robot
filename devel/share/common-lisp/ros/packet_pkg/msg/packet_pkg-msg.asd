
(cl:in-package :asdf)

(defsystem "packet_pkg-msg"
  :depends-on (:roslisp-msg-protocol :roslisp-utils :std_msgs-msg
)
  :components ((:file "_package")
    (:file "PacketData" :depends-on ("_package_PacketData"))
    (:file "_package_PacketData" :depends-on ("_package"))
  ))