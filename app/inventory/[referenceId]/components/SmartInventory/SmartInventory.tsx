
"use client"

import { useState } from "react"

import InventoryForm from "./InventoryForm"
import InventoryList from "./InventoryList"

export interface InventoryItem {

  id?: string

  category: string

  itemName: string

  quantity: number

}

interface SmartInventoryProps {

  referenceId: string

  inventoryMaster: any

  inventoryItems: InventoryItem[]

  setInventoryItems: React.Dispatch<
    React.SetStateAction<InventoryItem[]>
  >

}

export default function SmartInventory({

  referenceId,

  inventoryMaster,

  inventoryItems,

  setInventoryItems

}: SmartInventoryProps) {

  const [editingItem, setEditingItem] =
    useState<InventoryItem | null>(null)

  //--------------------------------------------------

  async function addItem(

    item: InventoryItem

  ) {

    try {

      const response = await fetch(

        "/api/inventory-items",

        {

          method: "POST",

          headers: {

            "Content-Type":

              "application/json"

          },

          body: JSON.stringify({

            referenceId,

            ...item

          })

        }

      )

      if (!response.ok) {

        throw new Error(

          "Unable to save item."

        )

      }

      const savedItem =

        await response.json()

      setInventoryItems(

        previous => [

          ...previous,

          savedItem

        ]

      )

    } catch (error) {

      console.error(error)

      alert(

        "Unable to save inventory item."

      )

    }

  }

  //--------------------------------------------------

  async function deleteItem(

    id: string

  ) {

    if (

      !confirm(

        "Delete this inventory item?"

      )

    ) {

      return

    }

    try {

      await fetch(

        `/api/inventory-items/${id}`,

        {

          method: "DELETE"

        }

      )

      setInventoryItems(

        previous =>

          previous.filter(

            item =>

              item.id !== id

          )

      )

    } catch (error) {

      console.error(error)

    }

  }

  //--------------------------------------------------

  async function updateItem(

    item: InventoryItem

  ) {

    try {

      const response = await fetch(

        `/api/inventory-items/${item.id}`,

        {

          method: "PUT",

          headers: {

            "Content-Type":

              "application/json"

          },

          body: JSON.stringify(item)

        }

      )

      const updated =

        await response.json()

      setInventoryItems(

        previous =>

          previous.map(

            existing =>

              existing.id === updated.id

                ? updated

                : existing

          )

      )

      setEditingItem(null)

    } catch (error) {

      console.error(error)

    }

  }

  //--------------------------------------------------

  return (

    <section className="space-y-8">

      <InventoryForm

        inventoryMaster={inventoryMaster}

        onAdd={addItem}

        editingItem={editingItem}

        onUpdate={updateItem}

        onCancel={() =>

          setEditingItem(null)

        }

      />

      <InventoryList

        items={inventoryItems}

        onEdit={setEditingItem}

        onDelete={deleteItem}

      />

    </section>

  )

}
 
